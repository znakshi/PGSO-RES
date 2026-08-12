import { supabase, ADMIN_EMAIL } from "./supabase-config.js";

let basePath = window.location.pathname.includes('-reservation') ? '../' : '';

function initClientLogin() {
    // Detect email confirmation redirect (Supabase appends #access_token or ?code=...)
    const urlParams = new URLSearchParams(window.location.search);
    const hashParams = new URLSearchParams(window.location.hash.substring(1));

    // Check if user just verified their email
    if (hashParams.has('access_token') || hashParams.has('type') || urlParams.has('code')) {
        // Prevent showing it multiple times
        if (!sessionStorage.getItem('email_confirmed_shown')) {
            // Immediately sign out in the background to prevent auto-login
            setTimeout(() => supabase.auth.signOut(), 500);

            const confirmSuccessHTML = `
            <div id="email-confirmed-modal" class="fixed inset-0 z-[200] flex items-center justify-center bg-black/60 backdrop-blur-sm transition-opacity duration-300">
                <div class="bg-white p-10 rounded-lg shadow-2xl flex flex-col items-center max-w-md w-[90%] text-center relative transform scale-100 transition-transform duration-300">
                    <h2 class="text-3xl font-bold text-gray-800 mb-4 tracking-wide">Verified!</h2>
                    <p class="text-gray-600 mb-8 text-[15px] leading-relaxed">
                        Your email has been successfully verified. You can now log in to your new account.
                    </p>
                    <div class="w-20 h-20 bg-[#00c853] rounded-full flex items-center justify-center mb-8 shadow-lg shadow-green-500/30">
                        <i class="fa-solid fa-check text-4xl text-white"></i>
                    </div>
                    <button id="email-verified-login-btn" class="w-full bg-[#00c853] hover:bg-green-600 text-white font-bold py-3 rounded-sm transition shadow border-none uppercase tracking-wide">
                        Login Now
                    </button>
                </div>
            </div>
            `;
            document.body.insertAdjacentHTML('beforeend', confirmSuccessHTML);
            sessionStorage.setItem('email_confirmed_shown', 'true');

            document.getElementById('email-verified-login-btn').addEventListener('click', async () => {
                // Ensure session is wiped before they log in manually
                await supabase.auth.signOut();
                localStorage.removeItem('pgsoReservationData');

                const m = document.getElementById('email-confirmed-modal');
                m.classList.add('opacity-0');
                setTimeout(() => {
                    m.remove();
                    // Clean URL
                    window.history.replaceState(null, document.title, window.location.pathname);

                    // Automatically open the login modal for them
                    const loginBtn = document.querySelector('.open-client-login');
                    if (loginBtn) {
                        loginBtn.click();
                    }
                }, 300);
            });
        }
    }

    if (document.getElementById('client-login-modal')) return;

    const modalHTML = `
    <div id="client-login-modal" class="fixed inset-0 z-[100] hidden items-center justify-center bg-black/60 backdrop-blur-sm transition-opacity opacity-0 duration-300">
        <div id="client-login-container" class="bg-white flex flex-col md:flex-row w-[90%] max-w-3xl min-h-[450px] rounded-sm overflow-hidden shadow-2xl relative transform scale-95 transition-transform duration-300">
            <!-- Left Side -->
            <div class="hidden md:block w-1/2 relative bg-cover bg-center" style="background-image: url('${basePath}pgso-building.jpg');">
                <div class="absolute inset-0 bg-black/50 overflow-hidden"></div>
                <div class="relative z-10 flex flex-col items-center justify-center h-full text-center text-white px-8">
                    <h2 class="text-3xl font-bold mb-4 drop-shadow-md">Welcome</h2>
                    <p class="text-sm font-light text-gray-100 leading-relaxed drop-shadow-sm">
                        Please log in using your personal<br>information to stay connected<br>with us.
                    </p>
                </div>
            </div>
            
            <!-- Right Side (Forms) -->
            <div class="w-full md:w-1/2 p-10 flex flex-col justify-center relative bg-white">
                <button type="button" id="close-login-modal" class="absolute top-4 right-4 text-gray-400 hover:text-gray-700 transition">
                    <i class="fa-solid fa-xmark text-xl"></i>
                </button>
                
                <!-- LOGIN VIEW -->
                <div id="login-view" class="flex flex-col w-full transition-opacity duration-300">
                    <h2 class="text-2xl font-bold text-center mb-6 tracking-wide text-gray-900 border-none">LOGIN</h2>
                    <div id="login-error-msg" class="hidden bg-red-100 text-red-600 text-xs p-2 rounded mb-4 text-center border-l-2 border-red-500"></div>
                    
                    <form id="client-login-form" class="flex flex-col gap-4">
                        <div>
                            <input type="email" id="login-email" placeholder="Email" class="w-full border border-gray-400 rounded-sm p-3 text-sm focus:outline-none focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500 transition" required>
                        </div>
                        <div class="relative">
                            <input type="password" id="login-password-input" placeholder="Password" class="w-full border border-gray-400 rounded-sm p-3 text-sm focus:outline-none focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500 transition" required>
                            <button type="button" id="toggle-login-password" class="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-700 transition bg-transparent border-none">
                                <i class="fa-regular fa-eye"></i>
                            </button>
                        </div>
                        
                        <div class="text-left mb-1">
                            <a href="#" class="text-xs text-cyan-500 hover:text-cyan-600 transition tracking-wide">Forgot password?</a>
                        </div>
                        
                        <button type="submit" id="login-submit-btn" class="w-full bg-cyan-400 hover:bg-cyan-500 text-white font-bold py-3 rounded-sm transition shadow border-none disabled:opacity-75 disabled:cursor-not-allowed">
                            Log In
                        </button>
                        
                        <p class="text-center text-xs text-gray-700 mt-6 tracking-wide">
                            Don't have an account? <a href="#" id="show-signup-link" class="text-cyan-400 hover:text-cyan-500 font-medium border-none underline-none cursor-pointer">Signup</a>
                        </p>
                    </form>
                </div>

                <!-- SIGNUP VIEW -->
                <div id="signup-view" class="hidden flex flex-col w-full transition-opacity duration-300">
                    <h2 class="text-2xl font-bold text-center mb-6 tracking-wide text-gray-900 border-none">SIGN UP</h2>
                    <div id="signup-error-msg" class="hidden bg-red-100 text-red-600 text-xs p-2 rounded mb-4 text-center border-l-2 border-red-500"></div>
                    <div id="signup-success-msg" class="hidden bg-green-100 text-green-700 text-xs p-2 rounded mb-4 text-center border-l-2 border-green-500"></div>
                    
                    <form id="client-signup-form" class="flex flex-col gap-4">
                        <div>
                            <input type="text" id="signup-name" placeholder="Full Name" class="w-full border border-gray-400 rounded-sm p-3 text-sm focus:outline-none focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500 transition" required>
                        </div>
                        <div>
                            <input type="email" id="signup-email" placeholder="Email" class="w-full border border-gray-400 rounded-sm p-3 text-sm focus:outline-none focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500 transition" required>
                        </div>
                        <div class="relative">
                            <input type="password" id="signup-password-input" placeholder="Password" minlength="6" class="w-full border border-gray-400 rounded-sm p-3 text-sm focus:outline-none focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500 transition" required>
                            <button type="button" id="toggle-signup-password" class="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-700 transition bg-transparent border-none">
                                <i class="fa-regular fa-eye"></i>
                            </button>
                        </div>
                        <div>
                            <input type="password" id="signup-confirm-password" placeholder="Confirm Password" minlength="6" class="w-full border border-gray-400 rounded-sm p-3 text-sm focus:outline-none focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500 transition" required>
                        </div>
                        
                        <button type="submit" id="signup-submit-btn" class="w-full bg-cyan-400 hover:bg-cyan-500 text-white font-bold py-3 mt-2 rounded-sm transition shadow border-none disabled:opacity-75 disabled:cursor-not-allowed">
                            Sign Up
                        </button>
                        
                        <p class="text-center text-xs text-gray-700 mt-4 tracking-wide">
                            Already have an account? <a href="#" id="show-login-link" class="text-cyan-400 hover:text-cyan-500 font-medium border-none underline-none cursor-pointer">Login</a>
                        </p>
                    </form>
                </div>

            </div>
        </div>
    </div>
    `;

    document.body.insertAdjacentHTML('beforeend', modalHTML);

    const modal = document.getElementById('client-login-modal');
    const container = document.getElementById('client-login-container');
    const closeBtn = document.getElementById('close-login-modal');

    // View Toggles
    const loginView = document.getElementById('login-view');
    const signupView = document.getElementById('signup-view');
    const showSignupLink = document.getElementById('show-signup-link');
    const showLoginLink = document.getElementById('show-login-link');

    // Password toggles
    const toggleLoginPwd = document.getElementById('toggle-login-password');
    const loginPwdInput = document.getElementById('login-password-input');
    const toggleSignupPwd = document.getElementById('toggle-signup-password');
    const signupPwdInput = document.getElementById('signup-password-input');

    // Forms
    const loginForm = document.getElementById('client-login-form');
    const loginErrorMsg = document.getElementById('login-error-msg');
    const loginSubmitBtn = document.getElementById('login-submit-btn');

    const signupForm = document.getElementById('client-signup-form');
    const signupErrorMsg = document.getElementById('signup-error-msg');
    const signupSuccessMsg = document.getElementById('signup-success-msg');
    const signupSubmitBtn = document.getElementById('signup-submit-btn');

    const openBtns = document.querySelectorAll('.open-client-login');
    openBtns.forEach(btn => {
        btn.addEventListener('click', async (e) => {
            e.preventDefault();

            // Check current session
            const { data: { session } } = await supabase.auth.getSession();
            const user = session?.user;

            // If already logged in
            if (user) {
                const logoutModalHTML = `
                <div id="logout-prompt-modal" class="fixed inset-0 z-[200] flex items-center justify-center bg-black/60 backdrop-blur-sm transition-opacity duration-300">
                    <div class="bg-white rounded-xl shadow-2xl flex flex-col w-[90%] max-w-sm overflow-visible transform transition-transform duration-300 relative mt-8">
                        <div class="absolute -top-8 left-1/2 -translate-x-1/2 w-16 h-16 bg-white rounded-full flex items-center justify-center shadow-sm z-10 border border-gray-100">
                            <div class="w-12 h-12 bg-slate-800 rounded-full flex items-center justify-center shadow-inner">
                                <i class="fa-solid fa-user text-white text-lg"></i>
                            </div>
                        </div>
                        <div class="p-8 pt-12 text-center flex flex-col items-center">
                            <h2 class="text-xl font-bold text-gray-800 mb-2 tracking-wide">Already Logged In</h2>
                            <p class="text-gray-500 mb-8 text-[14px] leading-relaxed">
                                You are currently logged in as <br><strong class="text-slate-700">${user.email}</strong>.<br><br>Would you like to log out?
                            </p>
                            <div class="flex flex-col gap-3 w-full">
                                <button id="btn-confirm-logout" class="w-full bg-red-600 hover:bg-red-700 text-white font-bold py-3.5 rounded-full transition shadow-md text-sm">
                                    Yes, Log Out
                                </button>
                                <button id="btn-cancel-logout" class="w-full bg-white text-slate-500 hover:bg-slate-50 border border-slate-200 font-bold py-3 rounded-full transition text-sm">
                                    Stay Logged In
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
                `;
                document.body.insertAdjacentHTML('beforeend', logoutModalHTML);

                const promptModal = document.getElementById('logout-prompt-modal');

                document.getElementById('btn-cancel-logout').addEventListener('click', () => {
                    promptModal.remove();
                });

                document.getElementById('btn-confirm-logout').addEventListener('click', async () => {
                    document.getElementById('btn-confirm-logout').innerHTML = '<i class="fa-solid fa-spinner fa-spin mr-2"></i> Logging out...';
                    await supabase.auth.signOut();
                    localStorage.removeItem('pgsoReservationData');

                    promptModal.querySelector('.p-8').innerHTML = `
                         <div class="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
                             <i class="fa-solid fa-info text-2xl text-blue-600"></i>
                         </div>
                         <h2 class="text-xl font-bold text-gray-800 mb-2">Logged Out</h2>
                         <p class="text-gray-500 text-[14px]">You have been successfully logged out.</p>
                    `;
                    setTimeout(() => window.location.href = basePath + 'index.html', 1500);
                });

                return;
            }

            modal.classList.remove('hidden');
            modal.classList.add('flex');
            void modal.offsetWidth;
            modal.classList.remove('opacity-0');
            modal.classList.add('opacity-100');
            container.classList.remove('scale-95');
            container.classList.add('scale-100');

            // Reset to login view
            signupView.classList.add('hidden');
            loginView.classList.remove('hidden');
            loginForm.reset();
            signupForm.reset();
            loginErrorMsg.classList.add('hidden');
            signupErrorMsg.classList.add('hidden');
            signupSuccessMsg.classList.add('hidden');
        });
    });

    const closeModal = () => {
        modal.classList.remove('opacity-100');
        modal.classList.add('opacity-0');
        container.classList.remove('scale-100');
        container.classList.add('scale-95');
        setTimeout(() => {
            modal.classList.add('hidden');
            modal.classList.remove('flex');
        }, 300);
    };

    closeBtn.addEventListener('click', closeModal);
    modal.addEventListener('click', (e) => {
        if (e.target === modal) closeModal();
    });

    // Toggle views
    showSignupLink.addEventListener('click', (e) => {
        e.preventDefault();
        loginView.classList.add('hidden');
        signupView.classList.remove('hidden');
    });

    showLoginLink.addEventListener('click', (e) => {
        e.preventDefault();
        signupView.classList.add('hidden');
        loginView.classList.remove('hidden');
    });

    // Toggle passwords
    const configurePasswordToggle = (toggleBtn, input) => {
        toggleBtn.addEventListener('click', () => {
            if (input.type === 'password') {
                input.type = 'text';
                toggleBtn.innerHTML = '<i class="fa-regular fa-eye-slash"></i>';
            } else {
                input.type = 'password';
                toggleBtn.innerHTML = '<i class="fa-regular fa-eye"></i>';
            }
        });
    };
    configurePasswordToggle(toggleLoginPwd, loginPwdInput);
    configurePasswordToggle(toggleSignupPwd, signupPwdInput);

    // Login Logic
    loginForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        const email = document.getElementById('login-email').value;
        const password = loginPwdInput.value;

        loginSubmitBtn.innerText = "Verifying...";
        loginSubmitBtn.disabled = true;
        loginErrorMsg.classList.add('hidden');

        if (email.toLowerCase() === ADMIN_EMAIL.toLowerCase()) {
            loginSubmitBtn.innerText = "Log In";
            loginSubmitBtn.disabled = false;
            loginErrorMsg.innerText = "Admin accounts cannot log in through the client portal.";
            loginErrorMsg.classList.remove('hidden');
            return;
        }

        try {
            const { data, error } = await supabase.auth.signInWithPassword({
                email: email,
                password: password,
            });

            if (error) throw error;

            const user = data.user;

            // Note: If Supabase requires email confirmation, login will fail with an error
            // "Email not confirmed". We handle that below.

            // Show custom success modal
            const successHTML = `
            <div id="login-success-modal" class="fixed inset-0 z-[200] flex items-center justify-center bg-black/60 backdrop-blur-sm transition-opacity duration-300">
                <div class="bg-white p-10 rounded-xl shadow-2xl flex flex-col items-center max-w-sm w-[90%] text-center relative border-t-8 border-[#00c853]">
                    <div class="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mb-6 shadow-inner">
                        <i class="fa-solid fa-check text-3xl text-[#00c853]"></i>
                    </div>
                    <h2 class="text-2xl font-bold text-gray-800 mb-2 tracking-wide">Welcome Back!</h2>
                    <p class="text-gray-500 mb-8 text-[14px]">You have successfully logged in.</p>
                    <button id="login-success-btn" class="w-full bg-[#00c853] hover:bg-green-600 text-white font-bold py-3.5 rounded-full transition shadow-md uppercase tracking-wide text-sm">
                        Continue to Portal
                    </button>
                </div>
            </div>
            `;
            document.body.insertAdjacentHTML('beforeend', successHTML);

            document.getElementById('login-success-btn').addEventListener('click', () => {
                document.getElementById('login-success-modal').remove();
                closeModal();
                window.location.href = basePath + 'venues.html';
            });

        } catch (error) {
            console.error(error);
            loginErrorMsg.classList.remove('hidden');
            if (error.message.includes('Invalid login credentials')) {
                loginErrorMsg.innerText = "Incorrect email or password.";
            } else if (error.message.includes('Email not confirmed')) {
                loginErrorMsg.innerText = "Please verify your email before logging in. Check your inbox.";
            } else if (error.message.includes('rate limit')) {
                loginErrorMsg.innerText = "Too many failed attempts. Try again later.";
            } else {
                loginErrorMsg.innerText = "Login failed: Try Again";
            }
        } finally {
            loginSubmitBtn.innerText = "Log In";
            loginSubmitBtn.disabled = false;
        }
    });

    // Signup Logic
    signupForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        const name = document.getElementById('signup-name').value;
        const email = document.getElementById('signup-email').value;
        const password = signupPwdInput.value;
        const confirmPassword = document.getElementById('signup-confirm-password').value;

        signupErrorMsg.classList.add('hidden');
        signupSuccessMsg.classList.add('hidden');

        if (email.toLowerCase() === ADMIN_EMAIL.toLowerCase()) {
            signupErrorMsg.innerText = "This email is reserved and cannot be used for client accounts.";
            signupErrorMsg.classList.remove('hidden');
            return;
        }

        if (password !== confirmPassword) {
            signupErrorMsg.innerText = "Passwords do not match!";
            signupErrorMsg.classList.remove('hidden');
            return;
        }

        signupSubmitBtn.innerText = "Creating Account...";
        signupSubmitBtn.disabled = true;

        try {
            const { data, error } = await supabase.auth.signUp({
                email: email,
                password: password,
                options: {
                    data: {
                        full_name: name,
                    },
                    emailRedirectTo: window.location.origin + window.location.pathname
                }
            });

            if (error) throw error;

            signupForm.reset();
            signupSuccessMsg.innerText = "Account created successfully! A verification link has been sent to your email. Please verify before logging in.";
            signupSuccessMsg.classList.remove('hidden');

            // Optionally, switch to login view after 3 seconds
            setTimeout(() => {
                showLoginLink.click();
            }, 5000);

        } catch (error) {
            console.error(error);
            signupErrorMsg.classList.remove('hidden');
            if (error.message.includes('already registered')) {
                signupErrorMsg.innerText = "This email is already registered.";
            } else if (error.message.includes('weak password')) {
                signupErrorMsg.innerText = "Password should be at least 6 characters.";
            } else {
                signupErrorMsg.innerText = error.message || "Sign Up failed: Try Again";
            }
        } finally {
            signupSubmitBtn.innerText = "Sign Up";
            signupSubmitBtn.disabled = false;
        }
    });

    // --- Global Back-Button Interceptor for Logged In Clients ---
    supabase.auth.getSession().then(({ data: { session } }) => {
        const p = window.location.pathname;
        const isHome = p.endsWith('index.html') || p === '/' || p.endsWith('pgso-res/') || p.endsWith('venues.html');

        if (session && session.user && isHome) {
            history.pushState({ pgsoBase: true }, null, location.href);

            window.addEventListener('popstate', function (event) {
                if (event.state && event.state.pgsoBase) return;
                if (window.location.hash) return;

                let backModal = document.getElementById('back-logout-modal');
                if (!backModal) {
                    const backModalHTML = `
                    <div id="back-logout-modal" class="fixed inset-0 z-[200] flex items-center justify-center bg-black/60 backdrop-blur-sm transition-opacity duration-300">
                        <div class="bg-white rounded-xl shadow-2xl flex flex-col w-[90%] max-w-sm overflow-visible transform transition-transform duration-300 relative mt-8">
                            <div class="absolute -top-8 left-1/2 -translate-x-1/2 w-16 h-16 bg-white rounded-full flex items-center justify-center shadow-sm z-10 border border-gray-100">
                                <div class="w-12 h-12 bg-red-600 rounded-full flex items-center justify-center shadow-inner">
                                    <i class="fa-solid fa-arrow-right-from-bracket text-white text-xl"></i>
                                </div>
                            </div>
                            <div class="p-8 pt-12 text-center flex flex-col items-center">
                                <h2 class="text-xl font-bold text-gray-800 mb-3 tracking-wide">Log Out?</h2>
                                <p class="text-gray-500 mb-8 text-[14px] leading-relaxed">
                                    You went back. Do you want to securely log out of your session?
                                </p>
                                <div class="flex flex-col gap-3 w-full">
                                    <button id="btn-confirm-back-logout" class="w-full bg-red-600 hover:bg-red-700 text-white font-bold py-3.5 rounded-full transition shadow-md text-sm">
                                        Yes, Log Out
                                    </button>
                                    <button id="btn-cancel-back-logout" class="w-full bg-white text-slate-600 hover:bg-slate-50 border border-slate-200 font-bold py-3 rounded-full transition text-sm">
                                        Stay logged in
                                    </button>
                                </div>
                            </div>
                        </div>
                    </div>`;
                    document.body.insertAdjacentHTML('beforeend', backModalHTML);
                    backModal = document.getElementById('back-logout-modal');

                    document.getElementById('btn-cancel-back-logout').addEventListener('click', () => {
                        backModal.classList.add('hidden');
                        history.pushState({ pgsoBase: true }, null, location.href);
                    });

                    document.getElementById('btn-confirm-back-logout').addEventListener('click', async () => {
                        const btn = document.getElementById('btn-confirm-back-logout');
                        btn.innerHTML = '<i class="fa-solid fa-spinner fa-spin mr-2"></i> Logging out...';
                        btn.disabled = true;
                        await supabase.auth.signOut();
                        window.location.replace(basePath + 'index.html');
                    });
                }
                backModal.classList.remove('hidden');
            });
        }
    });
}

async function setupClientNotifications() {
    // --- Client Notifications ---
    const { data: { session: currentSession } } = await supabase.auth.getSession();
    if (currentSession && currentSession.user) {
        const authContainer = document.getElementById('auth-container');
        if (authContainer && !document.getElementById('client-notif-wrapper')) {
            const notifWrapper = document.createElement('div');
            notifWrapper.id = "client-notif-wrapper";
            notifWrapper.className = "relative mr-4";
            notifWrapper.innerHTML = `
                <button id="client-notif-btn" class="w-10 h-10 rounded-full bg-slate-100 hover:bg-slate-200 text-slate-600 transition flex items-center justify-center relative shadow-sm border border-slate-200">
                    <i class="fa-regular fa-bell"></i>
                    <span id="client-notif-badge" class="absolute top-0 right-0 w-3 h-3 bg-red-500 rounded-full border border-white hidden"></span>
                </button>
                <div id="client-notif-dropdown" class="absolute right-0 mt-3 w-80 bg-white rounded-xl shadow-2xl border border-gray-100 hidden flex flex-col overflow-hidden z-[200]">
                    <div class="px-4 py-3 bg-slate-50 border-b border-gray-100 flex justify-between items-center">
                        <span class="font-bold text-slate-800 text-sm">Notifications</span>
                        <button id="client-mark-read" class="text-xs text-blue-600 hover:text-blue-800 font-medium">Mark all as read</button>
                    </div>
                    <div id="client-notif-list" class="max-h-80 overflow-y-auto">
                        <p class="text-sm text-slate-500 text-center py-6 italic">No notifications yet.</p>
                    </div>
                </div>
            `;
            authContainer.parentNode.insertBefore(notifWrapper, authContainer);

            const notifBtn = document.getElementById('client-notif-btn');
            const notifDropdown = document.getElementById('client-notif-dropdown');
            const notifList = document.getElementById('client-notif-list');
            const notifBadge = document.getElementById('client-notif-badge');

            notifBtn.addEventListener('click', (e) => {
                e.preventDefault();
                e.stopPropagation();
                notifDropdown.classList.toggle('hidden');
            });
            document.addEventListener('click', (e) => {
                if (!notifWrapper.contains(e.target)) notifDropdown.classList.add('hidden');
            });

            const renderClientNotifs = (notifs) => {
                notifList.innerHTML = '';
                const unread = notifs.filter(n => !n.is_read);
                if (unread.length > 0) {
                    notifBadge.classList.remove('hidden');
                } else {
                    notifBadge.classList.add('hidden');
                }

                if (notifs.length === 0) {
                    notifList.innerHTML = '<p class="text-sm text-slate-500 text-center py-6 italic">No notifications yet.</p>';
                    return;
                }

                notifs.forEach(n => {
                    const el = document.createElement('div');
                    el.className = `px-4 py-3 border-b border-gray-50 flex flex-col gap-1 ${n.is_read ? 'opacity-60 bg-white' : 'bg-blue-50/50'}`;
                    const dateStr = n.created_at ? new Date(n.created_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit' }) : '';
                    el.innerHTML = `
                        <div class="flex justify-between items-start">
                            <span class="font-bold text-sm ${n.is_read ? 'text-slate-600' : 'text-slate-900'}">${n.title}</span>
                            ${!n.is_read ? '<span class="w-2 h-2 bg-blue-500 rounded-full mt-1.5 flex-shrink-0"></span>' : ''}
                        </div>
                        <p class="text-xs text-slate-500 line-clamp-2">${n.message}</p>
                        ${dateStr ? `<span class="text-[10px] text-slate-400 mt-1">${dateStr}</span>` : ''}
                    `;
                    notifList.appendChild(el);
                });
            };

            const fetchClientNotifs = async () => {
                try {
                    const { data } = await supabase.from('notifications')
                        .select('*')
                        .eq('user_email', currentSession.user.email.toLowerCase())
                        .order('created_at', { ascending: false })
                        .limit(20);
                    if (data) renderClientNotifs(data);
                } catch (e) { console.error(e); }
            };

            document.getElementById('client-mark-read').addEventListener('click', async (e) => {
                e.stopPropagation();
                const { error } = await supabase.from('notifications')
                    .update({ is_read: true })
                    .eq('user_email', currentSession.user.email.toLowerCase())
                    .eq('is_read', false);
                if (!error) fetchClientNotifs();
            });

            supabase.channel('client-notifs')
                .on('postgres_changes', { event: '*', schema: 'public', table: 'notifications' }, () => {
                    fetchClientNotifs();
                }).subscribe();

            fetchClientNotifs();
        }
    }
}
function autoCleanArchive() {
    try {
        const oneYearAgo = new Date();
        oneYearAgo.setFullYear(oneYearAgo.getFullYear() - 1);
        const isoDate = oneYearAgo.toISOString();

        // Delete reservations older than 1 year that are archived
        supabase.from('reservations').delete().eq('is_archived', true).lt('created_at', isoDate).then();

        // Delete inventory older than 1 year that are archived
        supabase.from('inventory').delete().eq('is_archived', true).lt('created_at', isoDate).then();
    } catch (err) {
        console.error("Auto clean archive failed:", err);
    }
}

if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
        initClientLogin();
        setupClientNotifications();
        autoCleanArchive();
    });
} else {
    initClientLogin();
    setupClientNotifications();
    autoCleanArchive();
}
