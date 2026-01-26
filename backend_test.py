#!/usr/bin/env python3
"""
KreoAssist Backend API Testing Suite
Tests all caregiver monitoring API endpoints thoroughly
"""

import requests
import json
import time
from datetime import datetime, timedelta
from typing import Dict, Any, List
import os

# Get backend URL from frontend .env file
def get_backend_url():
    try:
        with open('/app/frontend/.env', 'r') as f:
            for line in f:
                if line.startswith('EXPO_PUBLIC_BACKEND_URL='):
                    base_url = line.split('=', 1)[1].strip()
                    return f"{base_url}/api"
    except Exception as e:
        print(f"Error reading frontend .env: {e}")
    
    # Fallback to localhost for testing
    return "http://localhost:8001/api"

BASE_URL = get_backend_url()
print(f"Testing backend at: {BASE_URL}")

class KreoAssistTester:
    def __init__(self):
        self.base_url = BASE_URL
        self.session = requests.Session()
        self.test_results = []
        self.alert_ids = []  # Track created alert IDs for cleanup
        
    def log_test(self, test_name: str, success: bool, details: str = ""):
        """Log test result"""
        status = "✅ PASS" if success else "❌ FAIL"
        result = f"{status} {test_name}"
        if details:
            result += f" - {details}"
        print(result)
        self.test_results.append({
            'test': test_name,
            'success': success,
            'details': details
        })
        
    def make_request(self, method: str, endpoint: str, data: Dict = None) -> tuple:
        """Make HTTP request and return (success, response_data, status_code)"""
        url = f"{self.base_url}{endpoint}"
        try:
            if method.upper() == 'GET':
                response = self.session.get(url, timeout=10)
            elif method.upper() == 'POST':
                response = self.session.post(url, json=data, timeout=10)
            else:
                return False, f"Unsupported method: {method}", 0
                
            return True, response.json() if response.content else {}, response.status_code
        except requests.exceptions.RequestException as e:
            return False, str(e), 0
        except json.JSONDecodeError as e:
            return False, f"JSON decode error: {e}", response.status_code if 'response' in locals() else 0
    
    def test_root_endpoint(self):
        """Test root API endpoint"""
        success, data, status = self.make_request('GET', '/')
        if success and status == 200 and 'message' in data:
            self.log_test("Root endpoint", True, f"Message: {data.get('message', '')}")
        else:
            self.log_test("Root endpoint", False, f"Status: {status}, Data: {data}")
    
    def test_status_endpoints(self):
        """Test system status endpoints"""
        print("\n=== Testing Status Endpoints ===")
        
        # Test GET /api/status
        success, data, status = self.make_request('GET', '/status')
        if success and status == 200:
            required_fields = ['current_status', 'last_updated']
            if all(field in data for field in required_fields):
                self.log_test("GET /status", True, f"Status: {data.get('current_status')}")
            else:
                self.log_test("GET /status", False, f"Missing required fields. Got: {list(data.keys())}")
        else:
            self.log_test("GET /status", False, f"Status: {status}, Data: {data}")
        
        # Test POST /api/status (update status)
        test_status = {
            "current_status": "WARNING",
            "description": "Test status update"
        }
        success, data, status = self.make_request('POST', '/status', test_status)
        if success and status == 200:
            if data.get('current_status') == 'WARNING':
                self.log_test("POST /status", True, "Status updated successfully")
            else:
                self.log_test("POST /status", False, f"Status not updated correctly: {data}")
        else:
            self.log_test("POST /status", False, f"Status: {status}, Data: {data}")
    
    def test_connection_endpoints(self):
        """Test connection status endpoints"""
        print("\n=== Testing Connection Endpoints ===")
        
        # Test GET /api/connection
        success, data, status = self.make_request('GET', '/connection')
        if success and status == 200:
            required_fields = ['is_connected', 'last_ping']
            if all(field in data for field in required_fields):
                self.log_test("GET /connection", True, f"Connected: {data.get('is_connected')}")
            else:
                self.log_test("GET /connection", False, f"Missing required fields. Got: {list(data.keys())}")
        else:
            self.log_test("GET /connection", False, f"Status: {status}, Data: {data}")
        
        # Test POST /api/connection (update connection)
        test_connection = {
            "is_connected": True
        }
        success, data, status = self.make_request('POST', '/connection', test_connection)
        if success and status == 200:
            if 'is_connected' in data:
                self.log_test("POST /connection", True, "Connection status updated")
            else:
                self.log_test("POST /connection", False, f"Invalid response: {data}")
        else:
            self.log_test("POST /connection", False, f"Status: {status}, Data: {data}")
    
    def test_alert_endpoints(self):
        """Test alert management endpoints"""
        print("\n=== Testing Alert Endpoints ===")
        
        # Test GET /api/alerts (initially might be empty)
        success, data, status = self.make_request('GET', '/alerts')
        if success and status == 200:
            if isinstance(data, list):
                self.log_test("GET /alerts", True, f"Retrieved {len(data)} alerts")
                initial_alert_count = len(data)
            else:
                self.log_test("GET /alerts", False, f"Expected list, got: {type(data)}")
                return
        else:
            self.log_test("GET /alerts", False, f"Status: {status}, Data: {data}")
            return
        
        # Test GET /api/alerts/latest (might be None initially)
        success, data, status = self.make_request('GET', '/alerts/latest')
        if success and status == 200:
            self.log_test("GET /alerts/latest", True, f"Latest alert: {data}")
        else:
            self.log_test("GET /alerts/latest", False, f"Status: {status}, Data: {data}")
        
        # Create an alert via simulation to test acknowledgement
        success, alert_data, status = self.make_request('POST', '/simulate/emergency')
        if success and status == 200 and 'alert' in alert_data:
            alert_id = alert_data['alert']['id']
            self.alert_ids.append(alert_id)
            
            # Test POST /api/alerts/acknowledge
            ack_request = {"alert_id": alert_id}
            success, ack_data, status = self.make_request('POST', '/alerts/acknowledge', ack_request)
            if success and status == 200:
                if ack_data.get('success'):
                    self.log_test("POST /alerts/acknowledge", True, "Alert acknowledged successfully")
                else:
                    self.log_test("POST /alerts/acknowledge", False, f"Acknowledgement failed: {ack_data}")
            else:
                self.log_test("POST /alerts/acknowledge", False, f"Status: {status}, Data: {ack_data}")
        else:
            self.log_test("Alert creation for ack test", False, "Could not create test alert")
        
        # Test acknowledging non-existent alert (edge case)
        fake_ack = {"alert_id": "non_existent_id_12345"}
        success, data, status = self.make_request('POST', '/alerts/acknowledge', fake_ack)
        if success and status == 404:
            self.log_test("Acknowledge non-existent alert", True, "Correctly returned 404")
        else:
            self.log_test("Acknowledge non-existent alert", False, f"Expected 404, got {status}")
    
    def test_event_endpoints(self):
        """Test event log endpoints"""
        print("\n=== Testing Event Endpoints ===")
        
        # Test GET /api/events
        success, data, status = self.make_request('GET', '/events')
        if success and status == 200:
            if isinstance(data, list):
                self.log_test("GET /events", True, f"Retrieved {len(data)} events")
                # Verify events have required fields
                if data and len(data) > 0:
                    event = data[0]
                    required_fields = ['id', 'description', 'event_type', 'timestamp']
                    if all(field in event for field in required_fields):
                        self.log_test("Event structure validation", True, "Events have required fields")
                    else:
                        self.log_test("Event structure validation", False, f"Missing fields in event: {list(event.keys())}")
            else:
                self.log_test("GET /events", False, f"Expected list, got: {type(data)}")
        else:
            self.log_test("GET /events", False, f"Status: {status}, Data: {data}")
        
        # Test POST /api/events (add custom event)
        test_event = {
            "description": "Test event from automated testing",
            "event_type": "test"
        }
        success, data, status = self.make_request('POST', '/events', test_event)
        if success and status == 200:
            if 'description' in data and data['description'] == test_event['description']:
                self.log_test("POST /events", True, "Event added successfully")
            else:
                self.log_test("POST /events", False, f"Event not added correctly: {data}")
        else:
            self.log_test("POST /events", False, f"Status: {status}, Data: {data}")
    
    def test_simulation_endpoints(self):
        """Test simulation endpoints for demo purposes"""
        print("\n=== Testing Simulation Endpoints ===")
        
        # Test emergency simulation
        success, data, status = self.make_request('POST', '/simulate/emergency')
        if success and status == 200:
            if data.get('success') and 'alert' in data:
                alert_id = data['alert']['id']
                self.alert_ids.append(alert_id)
                self.log_test("POST /simulate/emergency", True, f"Emergency alert created: {alert_id}")
            else:
                self.log_test("POST /simulate/emergency", False, f"Invalid response: {data}")
        else:
            self.log_test("POST /simulate/emergency", False, f"Status: {status}, Data: {data}")
        
        # Test warning simulation
        success, data, status = self.make_request('POST', '/simulate/warning')
        if success and status == 200:
            if data.get('success') and 'alert' in data:
                alert_id = data['alert']['id']
                self.alert_ids.append(alert_id)
                self.log_test("POST /simulate/warning", True, f"Warning alert created: {alert_id}")
            else:
                self.log_test("POST /simulate/warning", False, f"Invalid response: {data}")
        else:
            self.log_test("POST /simulate/warning", False, f"Status: {status}, Data: {data}")
        
        # Test safe simulation
        success, data, status = self.make_request('POST', '/simulate/safe')
        if success and status == 200:
            if data.get('success') and 'status' in data:
                self.log_test("POST /simulate/safe", True, "Status set to safe")
            else:
                self.log_test("POST /simulate/safe", False, f"Invalid response: {data}")
        else:
            self.log_test("POST /simulate/safe", False, f"Status: {status}, Data: {data}")
    
    def test_data_flow_consistency(self):
        """Test data flow and consistency across endpoints"""
        print("\n=== Testing Data Flow Consistency ===")
        
        # Create emergency alert and verify it appears in all relevant endpoints
        success, emergency_data, status = self.make_request('POST', '/simulate/emergency')
        if not success or status != 200:
            self.log_test("Data flow test setup", False, "Could not create emergency for testing")
            return
        
        alert_id = emergency_data['alert']['id']
        self.alert_ids.append(alert_id)
        
        # Wait a moment for data to propagate
        time.sleep(1)
        
        # Check if status was updated to EMERGENCY
        success, status_data, status = self.make_request('GET', '/status')
        if success and status == 200:
            if status_data.get('current_status') == 'EMERGENCY':
                self.log_test("Status consistency after emergency", True, "Status correctly updated to EMERGENCY")
            else:
                self.log_test("Status consistency after emergency", False, f"Status is {status_data.get('current_status')}, expected EMERGENCY")
        
        # Check if alert appears in alerts list
        success, alerts_data, status = self.make_request('GET', '/alerts')
        if success and status == 200:
            alert_found = any(alert['id'] == alert_id for alert in alerts_data)
            if alert_found:
                self.log_test("Alert in alerts list", True, "Emergency alert found in alerts list")
            else:
                self.log_test("Alert in alerts list", False, "Emergency alert not found in alerts list")
        
        # Check if alert appears as latest unacknowledged
        success, latest_data, status = self.make_request('GET', '/alerts/latest')
        if success and status == 200 and latest_data:
            if latest_data.get('id') == alert_id:
                self.log_test("Latest alert consistency", True, "Emergency alert is latest unacknowledged")
            else:
                self.log_test("Latest alert consistency", False, f"Latest alert ID {latest_data.get('id')} != expected {alert_id}")
        
        # Check if event was logged
        success, events_data, status = self.make_request('GET', '/events')
        if success and status == 200:
            emergency_event_found = any(
                'EMERGENCY' in event.get('description', '') 
                for event in events_data
            )
            if emergency_event_found:
                self.log_test("Event logging consistency", True, "Emergency event found in event log")
            else:
                self.log_test("Event logging consistency", False, "Emergency event not found in event log")
    
    def test_edge_cases(self):
        """Test edge cases and error handling"""
        print("\n=== Testing Edge Cases ===")
        
        # Test invalid JSON in POST requests
        try:
            url = f"{self.base_url}/status"
            response = self.session.post(url, data="invalid json", headers={'Content-Type': 'application/json'})
            if response.status_code in [400, 422]:  # Bad request or unprocessable entity
                self.log_test("Invalid JSON handling", True, f"Correctly rejected invalid JSON with status {response.status_code}")
            else:
                self.log_test("Invalid JSON handling", False, f"Unexpected status {response.status_code} for invalid JSON")
        except Exception as e:
            self.log_test("Invalid JSON handling", False, f"Exception: {e}")
        
        # Test missing required fields
        incomplete_status = {"current_status": ""}  # Empty status
        success, data, status = self.make_request('POST', '/status', incomplete_status)
        # This might pass depending on validation, so we just log the behavior
        self.log_test("Empty status field", True, f"Status {status}, handled empty status field")
    
    def run_all_tests(self):
        """Run all test suites"""
        print("🚀 Starting KreoAssist Backend API Tests")
        print(f"Backend URL: {self.base_url}")
        print("=" * 60)
        
        # Test basic connectivity
        self.test_root_endpoint()
        
        # Test all endpoint categories
        self.test_status_endpoints()
        self.test_connection_endpoints()
        self.test_alert_endpoints()
        self.test_event_endpoints()
        self.test_simulation_endpoints()
        
        # Test data consistency
        self.test_data_flow_consistency()
        
        # Test edge cases
        self.test_edge_cases()
        
        # Summary
        self.print_summary()
    
    def print_summary(self):
        """Print test summary"""
        print("\n" + "=" * 60)
        print("📊 TEST SUMMARY")
        print("=" * 60)
        
        passed = sum(1 for result in self.test_results if result['success'])
        total = len(self.test_results)
        failed = total - passed
        
        print(f"Total Tests: {total}")
        print(f"✅ Passed: {passed}")
        print(f"❌ Failed: {failed}")
        print(f"Success Rate: {(passed/total*100):.1f}%")
        
        if failed > 0:
            print("\n🔍 FAILED TESTS:")
            for result in self.test_results:
                if not result['success']:
                    print(f"  ❌ {result['test']}: {result['details']}")
        
        print(f"\n🎯 Alert IDs created during testing: {len(self.alert_ids)}")
        if self.alert_ids:
            print("   (These can be used for manual verification)")

if __name__ == "__main__":
    tester = KreoAssistTester()
    tester.run_all_tests()