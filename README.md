# Kreo Assist – Caregiver Monitoring Application

Kreo Assist is a caregiver-side mobile application developed as part of a **Smart Assistive Navigation System** project.  
The application allows caregivers to monitor the operational status of an assistive device used by a visually impaired user and be informed when potentially unsafe situations occur.

This repository represents the **prototype stage** of the system, focusing on application logic, user interface, and monitoring workflow.

---

## Objective

The primary objective of Kreo Assist is to provide caregivers with:
- Clear visibility of the assistive system’s status
- Immediate awareness of risk or alert conditions
- A simple and accessible monitoring interface

---

## Problem Statement

Visually impaired individuals rely on assistive devices to navigate their surroundings safely.  
While such devices can detect obstacles, caregivers often lack real-time insight into the system’s condition and alert states.

There is a requirement for a companion application that can:
- Display system activity
- Indicate dangerous conditions
- Support future expansion such as location tracking and notifications

---

## Proposed Solution

Kreo Assist serves as a monitoring interface for caregivers by:
- Displaying current system status
- Highlighting alert conditions visually
- Maintaining a minimal and easy-to-use design

The app is designed to work alongside assistive hardware and can be extended as hardware integration matures.

---

## Application Features

- **System Status Display**
  - Shows whether the assistive system is active and responsive

- **Alert Indication**
  - Visual alerts when a dangerous situation is detected

- **Simple User Interface**
  - Clean layout optimized for quick understanding

- **Prototype-Oriented Design**
  - Built for demonstration, testing, and evaluation

---

## System Workflow (Overview)

1. The assistive device detects environmental conditions
2. Device state and alert information are processed
3. The caregiver application displays:
   - System status
   - Alert state when required
4. Caregivers can monitor the situation in real time

---

## Technology Stack

### Mobile Application
- React Native
- Expo Framework

### Backend / Testing
- Python (logic testing and validation)

---

## Project Structure

```
│
├── frontend/ # React Native / Expo mobile app
├── backend/ # Backend logic and testing scripts
├── tests/ # Test and validation files
├── README.md # Project documentation
```


---

## Demo & Screen Recording

A complete screen recording of the application demonstrating:
- App launch
- System status display
- Alert indication behavior

is available at the link below:

🔗 **Screen Recording:**  
👉 [Recording of Application](app_recording.mp4)


---

## Current Limitations

- Live GPS tracking is not enabled due to hardware issues
- Direct hardware-to-app communication is in testing phase
- APK generation is pending final build configuration

---

## Future Scope

- Live location sharing for caregivers
- APK release for standalone installation
- Push notifications for alerts
- Full hardware integration
- Improved offline handling

---

## Conclusion

Kreo Assist successfully demonstrates the caregiver monitoring concept for a Smart Assistive Navigation System.  
The prototype validates the application flow, monitoring logic, and usability, providing a strong foundation for future development and deployment.

## Team

Parth Thukral(Software Manager), Parth Sharma(Project Lead), Krishna Yadav(Backend & Connectivity Manager), Akshat(Hardware Manager), Ishu Parjapati(UI & Documentation Manager), Tarun Kumar(System Designer)
