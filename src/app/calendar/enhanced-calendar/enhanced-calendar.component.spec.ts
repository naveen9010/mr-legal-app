import { ComponentFixture, TestBed } from '@angular/core/testing';

import { EnhancedCalendarComponent } from './enhanced-calendar.component';

describe('EnhancedCalendarComponent', () => {
  let component: EnhancedCalendarComponent;
  let fixture: ComponentFixture<EnhancedCalendarComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [EnhancedCalendarComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(EnhancedCalendarComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
