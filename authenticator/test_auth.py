import unittest
import requests
import json
import os


class TestApi(unittest.TestCase):
    #with fastapi default port is 8000 with flask is 5000
    base_url = "http://127.0.0.1:8000"
    

    def create_new_user(self, username, password):
        endpoint = "/users"
        url = f"{self.base_url}{endpoint}"
        response = requests.post(url, json={"username":username, "password":password})

        return response

    def change_user_password(self, username, password, new_password):
        endpoint = "/users"
        url = f"{self.base_url}{endpoint}"
        response = requests.put(url, json={"username": username, "password": password, "new_password": new_password})
        
        return response

    def ask_for_jwt(self, username, password):
        endpoint = "/users/login"
        url = f"{self.base_url}{endpoint}"
        response = requests.post(url, json={"username": username, "password": password})
        
        return response

   
    """
    /users - POST
    :username-a unique username
    :password-ausers password
    Create a new user with username and password and store it in a table
    201
    409 "duplicate"
    """
    
    def test_post_users(self):

        endpoint = "/users"
        url = f"{self.base_url}{endpoint}"

        response = self.create_new_user("username", "password")

        self.assertEqual(response.status_code, 201, f"Expected status code 201, butt got {response.status_code}")

        response = self.create_new_user("username", "password")

        self.assertEqual(response.status_code, 409, f"Expected status code 409, buut got {response.status_code}")
        
        data = response.json()
        error_message = data.get('detail')
        self.assertEqual(error_message, "duplicate", f"Expected duplicate, but got {response.status_code}")



    """
    /users - PUT
    :username–a unique username
    :old-password:the current password of the user
    :new-password:the new password of the user
    Update the user’s password if the user presents the correct old password, or else return 403.
    200
    403 "forbidden"
    """
    
    def test_put_users(self):

        response = self.create_new_user("username1", "password1")
        self.assertEqual(response.status_code, 201, f"Expected status code 201, butt got {response.status_code}")

        response = self.change_user_password("username1", "password1", "new_password")

        self.assertEqual(response.status_code, 200, f"Expected status code 200, beat got {response.status_code}")

        response = self.change_user_password("username1", "passworddd", "new_password")

        self.assertEqual(response.status_code, 403, f"Expected status code 403, beet got {response.status_code}")

        data = response.json()
        error_message = data.get('detail')
        self.assertEqual(error_message, "forbidden", f"Expected forbidden, but got {response.status_code}")

    

    """
    /users/login - POST
    :username-a unique username
    :password-a users password
    Check if username and password exist in the table and generate a JWT or else return 403
    200, JWT
    403, "forbidden"
    """

    def test_post_users_login(self):

        endpoint = "/users/login"
        url = f"{self.base_url}{endpoint}" 
        print("using url"+str(url))

        response = self.create_new_user("my_username3", "my_password3")
        self.assertEqual(response.status_code, 201, f"Expected status code 201, butt got {response.status_code}")

        response = self.ask_for_jwt("my_username3","my_password3")

        self.assertEqual(response.status_code, 200, f"Expected status code 200, but got {response.status_code}")

        #TODO add validation of JWT returned

        response = self.ask_for_jwt("my_username3","my_password4")

        self.assertEqual(response.status_code, 403, f"Expected status code 403, but got {response.status_code}")

        data = response.json()
        error_message = data.get('detail')
        self.assertEqual(error_message, "forbidden", f"Expected forbidden, but got {response.status_code}")

    

    

if __name__ == '__main__':
    unittest.main()