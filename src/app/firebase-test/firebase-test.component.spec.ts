import { ComponentFixture, TestBed } from '@angular/core/testing';

import { FirebaseTestComponent } from './firebase-test.component';

describe('FirebaseTestComponent', () => {
  let component: FirebaseTestComponent;
  let fixture: ComponentFixture<FirebaseTestComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [FirebaseTestComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(FirebaseTestComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
