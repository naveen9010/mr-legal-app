import { Injectable } from '@angular/core';
import { Firestore, collection, doc, getDoc, getDocs, updateDoc, query, where, onSnapshot } from '@angular/fire/firestore';
import { CalendarService } from './calendar.service';
import { NotificationService } from './notification.service';
import { BehaviorSubject } from 'rxjs';

export interface Consultation {
  id: string;
  clientName: string;
  email: string;
  phone: string;
  consultDate: string;
  consultTime: string;
  message: string;
  status: 'pending' | 'accepted' | 'declined';
  createdAt: any;
}

@Injectable({
  providedIn: 'root'
})
export class ConsultationService {
  private pendingConsultations = new BehaviorSubject<Consultation[]>([]);
  pendingConsultations$ = this.pendingConsultations.asObservable();

  constructor(
    private firestore: Firestore,
    private calendarService: CalendarService | null,
    private notificationService: NotificationService
  ) {
    this.listenForConsultations();
  }

  /**
   * Listen for pending consultations
   */
  private listenForConsultations(): void {
    const consultationsRef = collection(this.firestore, 'consultations');
    const pendingQuery = query(consultationsRef, where('status', '==', 'pending'));
    
    onSnapshot(pendingQuery, (snapshot) => {
      const consultations: Consultation[] = [];
      snapshot.forEach(doc => {
        consultations.push({ id: doc.id, ...doc.data() } as Consultation);
      });
      this.pendingConsultations.next(consultations);
    });
  }

  /**
   * Accept a consultation request
   * @param consultationId The ID of the consultation to accept
   */
  async acceptConsultation(consultationId: string): Promise<boolean> {
    try {
      // Get the consultation details
      const consultationRef = doc(this.firestore, 'consultations', consultationId);
      const consultationSnap = await getDoc(consultationRef);
      
      if (!consultationSnap.exists()) {
        console.error('Consultation not found');
        return false;
      }
      
      const consultation = { id: consultationSnap.id, ...consultationSnap.data() } as Consultation;
      
      // Update the consultation status
      await updateDoc(consultationRef, { status: 'accepted' });
      
      // Add to Google Calendar if calendarService is available
      if (this.calendarService) {
        await this.calendarService.createHearingEvent({
        caseTitle: `Consultation with ${consultation.clientName}`,
        caseNumber: '',
        courtName: '',
        judgeName: '',
        clientName: consultation.clientName,
        hearingDate: consultation.consultDate,
        hearingTime: consultation.consultTime,
        notes: `Phone: ${consultation.phone}\nEmail: ${consultation.email}\nDetails: ${consultation.message}`
        });
      } else {
        console.warn('CalendarService not available, skipping calendar event creation');
      }
      
      return true;
    } catch (error) {
      console.error('Error accepting consultation:', error);
      return false;
    }
  }

  /**
   * Decline a consultation request
   * @param consultationId The ID of the consultation to decline
   */
  async declineConsultation(consultationId: string): Promise<boolean> {
    try {
      const consultationRef = doc(this.firestore, 'consultations', consultationId);
      await updateDoc(consultationRef, { status: 'declined' });
      return true;
    } catch (error) {
      console.error('Error declining consultation:', error);
      return false;
    }
  }

  /**
   * Get all pending consultations
   */
  async getPendingConsultations(): Promise<Consultation[]> {
    try {
      const consultationsRef = collection(this.firestore, 'consultations');
      const pendingQuery = query(consultationsRef, where('status', '==', 'pending'));
      const snapshot = await getDocs(pendingQuery);
      
      const consultations: Consultation[] = [];
      snapshot.forEach(doc => {
        consultations.push({ id: doc.id, ...doc.data() } as Consultation);
      });
      
      return consultations;
    } catch (error) {
      console.error('Error getting pending consultations:', error);
      return [];
    }
  }
}
