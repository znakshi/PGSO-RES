// 1. IMPORT FIREBASE AUTH
        import { initializeApp } from "https://www.gstatic.com/firebasejs/11.0.2/firebase-app.js";
        import { getAuth, signInWithEmailAndPassword } from "https://www.gstatic.com/firebasejs/11.0.2/firebase-auth.js";

        // 2. CONFIGURATION (Same as your other files)
        const firebaseConfig = {
            apiKey: "AIzaSyAP1Be3j515EWLvwHN_tQswa2f4FpKIAcE",
            authDomain: "pgso-res.firebaseapp.com",
            projectId: "pgso-res",
            storageBucket: "pgso-res.firebasestorage.app",
            messagingSenderId: "790940912470",
            appId: "1:790940912470:web:014b85641f74ee513f24f7"
        };

        const app = initializeApp(firebaseConfig);
        const auth = getAuth(app);

        // 3. HANDLE LOGIN
        document.getElementById('login-form').addEventListener('submit', async (event) => {
            event.preventDefault(); // Stop page reload

            const email = document.getElementById('email').value;
            const password = document.getElementById('password').value;
            const btn = document.getElementById('login-btn');
            const errorMsg = document.getElementById('error-msg');

            // Reset UI
            btn.innerText = "Verifying...";
            btn.disabled = true;
            btn.classList.add('opacity-75', 'cursor-not-allowed');
            errorMsg.classList.add('hidden');

            try {
                // Attempt login
                await signInWithEmailAndPassword(auth, email, password);
                
                // If successful, redirect
                window.location.href = "../admin-dashboard/admin-dashboard.html";
                
            } catch (error) {
                console.error("Login Error:", error.code);
                
                // Show Error
                btn.innerText = "Sign In";
                btn.disabled = false;
                btn.classList.remove('opacity-75', 'cursor-not-allowed');
                errorMsg.classList.remove('hidden');

                if (error.code === 'auth/invalid-credential' || error.code === 'auth/user-not-found' || error.code === 'auth/wrong-password') {
                    errorMsg.innerText = "Incorrect email or password.";
                } else if (error.code === 'auth/too-many-requests') {
                    errorMsg.innerText = "Too many failed attempts. Try again later.";
                } else {
                    errorMsg.innerText = "Login failed: Try Again ";
                }
            }
        });