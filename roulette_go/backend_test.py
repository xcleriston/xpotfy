#!/usr/bin/env python3
"""
Comprehensive Backend Testing for Roulette Automation System
Tests all FastAPI endpoints, authentication, automation, and WebSocket functionality
"""

import requests
import json
import time
import asyncio
import websockets
import uuid
from datetime import datetime
from typing import Dict, Any

# Configuration
BASE_URL = "https://a63ab0d3-6fd5-417e-95e9-b84c6e8dbe0c.preview.emergentagent.com/api"
WS_URL = "wss://a63ab0d3-6fd5-417e-95e9-b84c6e8dbe0c.preview.emergentagent.com/ws"

# Test data
TEST_USER = {
    "username": f"testuser_{uuid.uuid4().hex[:8]}",
    "password": "TestPass123!"
}

ADMIN_USER = {
    "username": "admin",
    "password": "Admin123!"
}

class BackendTester:
    def __init__(self):
        self.session = requests.Session()
        self.user_token = None
        self.admin_token = None
        self.test_results = []
        self.user_id = None
        
    def log_test(self, test_name: str, success: bool, message: str, details: Any = None):
        """Log test results"""
        result = {
            "test": test_name,
            "success": success,
            "message": message,
            "timestamp": datetime.now().isoformat(),
            "details": details
        }
        self.test_results.append(result)
        status = "✅ PASS" if success else "❌ FAIL"
        print(f"{status} - {test_name}: {message}")
        if details and not success:
            print(f"   Details: {details}")
    
    def test_health_check(self):
        """Test health check endpoint"""
        try:
            response = self.session.get(f"{BASE_URL}/health", timeout=10)
            if response.status_code == 200:
                data = response.json()
                self.log_test("Health Check", True, "Server is healthy", data)
                return True
            else:
                self.log_test("Health Check", False, f"Status code: {response.status_code}", response.text)
                return False
        except Exception as e:
            self.log_test("Health Check", False, f"Connection error: {str(e)}")
            return False
    
    def test_user_registration(self):
        """Test user registration"""
        try:
            response = self.session.post(
                f"{BASE_URL}/register",
                json=TEST_USER,
                timeout=10
            )
            
            if response.status_code == 200:
                data = response.json()
                self.log_test("User Registration", True, "User registered successfully", data)
                return True
            else:
                self.log_test("User Registration", False, f"Status code: {response.status_code}", response.text)
                return False
        except Exception as e:
            self.log_test("User Registration", False, f"Error: {str(e)}")
            return False
    
    def test_user_login(self):
        """Test user login"""
        try:
            response = self.session.post(
                f"{BASE_URL}/login",
                json=TEST_USER,
                timeout=10
            )
            
            if response.status_code == 200:
                data = response.json()
                self.user_token = data.get("access_token")
                self.user_id = data.get("user", {}).get("id")
                
                if self.user_token:
                    self.session.headers.update({"Authorization": f"Bearer {self.user_token}"})
                    self.log_test("User Login", True, "Login successful", {
                        "token_received": bool(self.user_token),
                        "user_id": self.user_id
                    })
                    return True
                else:
                    self.log_test("User Login", False, "No token received", data)
                    return False
            else:
                self.log_test("User Login", False, f"Status code: {response.status_code}", response.text)
                return False
        except Exception as e:
            self.log_test("User Login", False, f"Error: {str(e)}")
            return False
    
    def test_admin_login(self):
        """Test admin login"""
        try:
            response = self.session.post(
                f"{BASE_URL}/login",
                json=ADMIN_USER,
                timeout=10
            )
            
            if response.status_code == 200:
                data = response.json()
                self.admin_token = data.get("access_token")
                
                if self.admin_token and data.get("user", {}).get("role") == "admin":
                    self.log_test("Admin Login", True, "Admin login successful", {
                        "role": data.get("user", {}).get("role"),
                        "username": data.get("user", {}).get("username")
                    })
                    return True
                else:
                    self.log_test("Admin Login", False, "Invalid admin credentials or role", data)
                    return False
            else:
                self.log_test("Admin Login", False, f"Status code: {response.status_code}", response.text)
                return False
        except Exception as e:
            self.log_test("Admin Login", False, f"Error: {str(e)}")
            return False
    
    def test_get_sites(self):
        """Test get available sites"""
        try:
            response = self.session.get(f"{BASE_URL}/sites", timeout=10)
            
            if response.status_code == 200:
                sites = response.json()
                if isinstance(sites, list) and len(sites) > 0:
                    self.log_test("Get Sites", True, f"Retrieved {len(sites)} sites", sites)
                    return True
                else:
                    self.log_test("Get Sites", False, "No sites returned", sites)
                    return False
            else:
                self.log_test("Get Sites", False, f"Status code: {response.status_code}", response.text)
                return False
        except Exception as e:
            self.log_test("Get Sites", False, f"Error: {str(e)}")
            return False
    
    def test_get_strategies(self):
        """Test get available strategies"""
        try:
            response = self.session.get(f"{BASE_URL}/strategies", timeout=10)
            
            if response.status_code == 200:
                strategies = response.json()
                expected_strategies = ["martingale", "fibonacci", "flat"]
                
                if isinstance(strategies, dict) and all(s in strategies for s in expected_strategies):
                    self.log_test("Get Strategies", True, f"Retrieved {len(strategies)} strategies", list(strategies.keys()))
                    return True
                else:
                    self.log_test("Get Strategies", False, "Missing expected strategies", strategies)
                    return False
            else:
                self.log_test("Get Strategies", False, f"Status code: {response.status_code}", response.text)
                return False
        except Exception as e:
            self.log_test("Get Strategies", False, f"Error: {str(e)}")
            return False
    
    def test_user_tickets(self):
        """Test get user tickets/credits"""
        try:
            if not self.user_token:
                self.log_test("User Tickets", False, "No user token available")
                return False
            
            response = self.session.get(f"{BASE_URL}/user/tickets", timeout=10)
            
            if response.status_code == 200:
                ticket = response.json()
                if "credits" in ticket:
                    self.log_test("User Tickets", True, f"User has {ticket['credits']} credits", ticket)
                    return True
                else:
                    self.log_test("User Tickets", False, "No credits field in response", ticket)
                    return False
            else:
                self.log_test("User Tickets", False, f"Status code: {response.status_code}", response.text)
                return False
        except Exception as e:
            self.log_test("User Tickets", False, f"Error: {str(e)}")
            return False
    
    def test_user_history(self):
        """Test get user betting history"""
        try:
            if not self.user_token:
                self.log_test("User History", False, "No user token available")
                return False
            
            response = self.session.get(f"{BASE_URL}/user/history", timeout=10)
            
            if response.status_code == 200:
                history = response.json()
                if isinstance(history, list):
                    self.log_test("User History", True, f"Retrieved {len(history)} history records", {"count": len(history)})
                    return True
                else:
                    self.log_test("User History", False, "Invalid history format", history)
                    return False
            else:
                self.log_test("User History", False, f"Status code: {response.status_code}", response.text)
                return False
        except Exception as e:
            self.log_test("User History", False, f"Error: {str(e)}")
            return False
    
    def test_start_automation(self):
        """Test start automation in simulation mode"""
        try:
            if not self.user_token:
                self.log_test("Start Automation", False, "No user token available")
                return False
            
            automation_config = {
                "site": "blaze.bet.br",
                "game": "mega_fire_blaze",
                "strategy": "martingale",
                "initial_bet": 1.0,
                "max_steps": 3,  # Small number for testing
                "target_color": "red",
                "mode": "simulation"
            }
            
            response = self.session.post(
                f"{BASE_URL}/start-automation",
                json=automation_config,
                timeout=15
            )
            
            if response.status_code == 200:
                data = response.json()
                if data.get("message") and data.get("mode") == "simulation":
                    self.log_test("Start Automation", True, "Automation started successfully", data)
                    return True
                else:
                    self.log_test("Start Automation", False, "Invalid response format", data)
                    return False
            else:
                self.log_test("Start Automation", False, f"Status code: {response.status_code}", response.text)
                return False
        except Exception as e:
            self.log_test("Start Automation", False, f"Error: {str(e)}")
            return False
    
    def test_admin_get_users(self):
        """Test admin get all users"""
        try:
            if not self.admin_token:
                self.log_test("Admin Get Users", False, "No admin token available")
                return False
            
            # Use admin token
            headers = {"Authorization": f"Bearer {self.admin_token}"}
            response = self.session.get(f"{BASE_URL}/admin/users", headers=headers, timeout=10)
            
            if response.status_code == 200:
                users = response.json()
                if isinstance(users, list) and len(users) > 0:
                    self.log_test("Admin Get Users", True, f"Retrieved {len(users)} users", {"count": len(users)})
                    return True
                else:
                    self.log_test("Admin Get Users", False, "No users returned", users)
                    return False
            else:
                self.log_test("Admin Get Users", False, f"Status code: {response.status_code}", response.text)
                return False
        except Exception as e:
            self.log_test("Admin Get Users", False, f"Error: {str(e)}")
            return False
    
    def test_admin_add_credits(self):
        """Test admin add credits to user"""
        try:
            if not self.admin_token or not self.user_id:
                self.log_test("Admin Add Credits", False, "No admin token or user ID available")
                return False
            
            # Use admin token
            headers = {"Authorization": f"Bearer {self.admin_token}"}
            response = self.session.post(
                f"{BASE_URL}/admin/add-credits",
                params={"user_id": self.user_id, "credits": 50},
                headers=headers,
                timeout=10
            )
            
            if response.status_code == 200:
                data = response.json()
                if "Added" in data.get("message", ""):
                    self.log_test("Admin Add Credits", True, "Credits added successfully", data)
                    return True
                else:
                    self.log_test("Admin Add Credits", False, "Invalid response format", data)
                    return False
            else:
                self.log_test("Admin Add Credits", False, f"Status code: {response.status_code}", response.text)
                return False
        except Exception as e:
            self.log_test("Admin Add Credits", False, f"Error: {str(e)}")
            return False
    
    async def test_websocket_connection(self):
        """Test WebSocket connection"""
        try:
            async with websockets.connect(WS_URL, timeout=10) as websocket:
                # Send a test message
                test_message = "Hello WebSocket"
                await websocket.send(test_message)
                
                # Wait for response
                response = await asyncio.wait_for(websocket.recv(), timeout=5)
                
                if response and "Message:" in response:
                    self.log_test("WebSocket Connection", True, "WebSocket communication successful", {
                        "sent": test_message,
                        "received": response
                    })
                    return True
                else:
                    self.log_test("WebSocket Connection", False, "Invalid WebSocket response", response)
                    return False
                    
        except Exception as e:
            self.log_test("WebSocket Connection", False, f"WebSocket error: {str(e)}")
            return False
    
    def run_all_tests(self):
        """Run all backend tests"""
        print("🚀 Starting Backend Testing for Roulette Automation System")
        print("=" * 60)
        
        # Test sequence
        tests = [
            ("Health Check", self.test_health_check),
            ("User Registration", self.test_user_registration),
            ("User Login", self.test_user_login),
            ("Admin Login", self.test_admin_login),
            ("Get Sites", self.test_get_sites),
            ("Get Strategies", self.test_get_strategies),
            ("User Tickets", self.test_user_tickets),
            ("User History", self.test_user_history),
            ("Start Automation", self.test_start_automation),
            ("Admin Get Users", self.test_admin_get_users),
            ("Admin Add Credits", self.test_admin_add_credits),
        ]
        
        # Run synchronous tests
        for test_name, test_func in tests:
            try:
                test_func()
                time.sleep(1)  # Brief pause between tests
            except Exception as e:
                self.log_test(test_name, False, f"Test execution error: {str(e)}")
        
        # Run WebSocket test
        try:
            asyncio.run(self.test_websocket_connection())
        except Exception as e:
            self.log_test("WebSocket Connection", False, f"WebSocket test error: {str(e)}")
        
        # Summary
        self.print_summary()
    
    def print_summary(self):
        """Print test summary"""
        print("\n" + "=" * 60)
        print("📊 TEST SUMMARY")
        print("=" * 60)
        
        passed = sum(1 for result in self.test_results if result["success"])
        failed = len(self.test_results) - passed
        
        print(f"Total Tests: {len(self.test_results)}")
        print(f"✅ Passed: {passed}")
        print(f"❌ Failed: {failed}")
        print(f"Success Rate: {(passed/len(self.test_results)*100):.1f}%")
        
        if failed > 0:
            print("\n🔍 FAILED TESTS:")
            for result in self.test_results:
                if not result["success"]:
                    print(f"  • {result['test']}: {result['message']}")
        
        print("\n" + "=" * 60)
        
        return passed, failed

if __name__ == "__main__":
    tester = BackendTester()
    tester.run_all_tests()