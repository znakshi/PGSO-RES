        import { supabase } from "./supabase-config.js";

        document.addEventListener('DOMContentLoaded', async () => {
            const { data: { session } } = await supabase.auth.getSession();
            const authContainer = document.getElementById('auth-container');
            
            if (!session || !session.user) {
                // If not logged in, they shouldn't be here
                window.location.href = 'venues.html';
                return;
            }

            // === Sidebar & UI Setup ===
            const sidebar = document.getElementById('profile-sidebar');
            const backdrop = document.getElementById('sidebar-backdrop');
            const closeBtn = document.getElementById('close-sidebar');
            const logoutBtn = document.getElementById('sidebar-logout');
            
            const fullName = session.user.user_metadata?.full_name || "Client";
            const initial = fullName.charAt(0).toUpperCase();
            const currentAvatar = session.user.user_metadata?.avatar_url;

            let authBtnContent = currentAvatar 
                ? `<div class="w-full h-full rounded-full bg-cover bg-center" style="background-image: url(${currentAvatar})"></div>`
                : initial;

            authContainer.innerHTML = `
                <button id="open-sidebar-btn" class="w-10 h-10 rounded-full bg-blue-700 text-white flex items-center justify-center font-bold text-lg hover:bg-blue-800 transition shadow-md border-2 border-white cursor-pointer relative group overflow-hidden">
                    ${authBtnContent}
                    <span class="absolute right-0 top-12 w-max bg-slate-900 text-white text-[10px] px-2 py-1 rounded opacity-0 group-hover:opacity-100 transition-opacity">Profile</span>
                </button>
            `;

            document.getElementById('sidebar-name').innerText = fullName;
            document.getElementById('sidebar-email').innerText = session.user.email;
            
            if (currentAvatar) {
                document.getElementById('sidebar-avatar').innerHTML = '';
                document.getElementById('sidebar-avatar').style.backgroundImage = `url(${currentAvatar})`;
                document.getElementById('sidebar-avatar').style.backgroundSize = 'cover';
                document.getElementById('sidebar-avatar').style.backgroundPosition = 'center';

                document.getElementById('profile-avatar-display').style.backgroundImage = `url(${currentAvatar})`;
                document.getElementById('profile-initial').style.display = 'none';
            } else {
                document.getElementById('sidebar-avatar').innerHTML = `<span class="font-bold font-sans">${initial}</span>`;
                document.getElementById('profile-initial').innerText = initial;
            }

            document.getElementById('email').value = session.user.email;
            
            // Avatar Handling Logic
            let pendingAvatarUrl = null;

            document.getElementById('avatar-upload').addEventListener('change', function(e) {
                const file = e.target.files[0];
                if (!file) return;

                const reader = new FileReader();
                reader.onload = function(event) {
                    const img = new Image();
                    img.onload = function() {
                        const canvas = document.createElement('canvas');
                        const ctx = canvas.getContext('2d');
                        const maxSize = 150;
                        let width = img.width;
                        let height = img.height;
                        if (width > height) {
                            if (width > maxSize) {
                                height *= maxSize / width;
                                width = maxSize;
                            }
                        } else {
                            if (height > maxSize) {
                                width *= maxSize / height;
                                height = maxSize;
                            }
                        }
                        canvas.width = width;
                        canvas.height = height;
                        ctx.drawImage(img, 0, 0, width, height);
                        const dataUrl = canvas.toDataURL('image/jpeg', 0.8);
                        pendingAvatarUrl = dataUrl;
                        
                        document.getElementById('profile-avatar-display').style.backgroundImage = `url(${dataUrl})`;
                        document.getElementById('profile-initial').style.display = 'none';
                    };
                    img.src = event.target.result;
                };
                reader.readAsDataURL(file);
            });

            document.getElementById('clear-avatar-btn').addEventListener('click', function() {
                pendingAvatarUrl = ''; // Empty string signals deletion
                document.getElementById('profile-avatar-display').style.backgroundImage = '';
                document.getElementById('profile-initial').style.display = 'block';
                document.getElementById('avatar-upload').value = '';
            });
            
            // split name simply if available
            if(fullName) {
                const parts = fullName.split(' ');
                document.getElementById('first-name').value = parts[0] || '';
                if(parts.length > 1) {
                    document.getElementById('last-name').value = parts.slice(1).join(' ');
                }
            }

            const toggleSidebar = (show) => {
                if (show) {
                    backdrop.classList.remove('hidden');
                    void backdrop.offsetWidth; 
                    backdrop.classList.remove('opacity-0');
                    sidebar.classList.remove('translate-x-full');
                } else {
                    backdrop.classList.add('opacity-0');
                    sidebar.classList.add('translate-x-full');
                    setTimeout(() => backdrop.classList.add('hidden'), 300);
                }
            };

            document.getElementById('open-sidebar-btn').addEventListener('click', () => toggleSidebar(true));
            closeBtn.addEventListener('click', () => toggleSidebar(false));
            backdrop.addEventListener('click', () => toggleSidebar(false));

            logoutBtn.addEventListener('click', async () => {
                logoutBtn.innerHTML = '<i class="fa-solid fa-spinner fa-spin"></i> Logging out...';
                await supabase.auth.signOut();
                window.location.href = 'index.html';
            });
            
            // Profile Form Handling
            document.getElementById('profile-form').addEventListener('submit', async (e) => {
                e.preventDefault();
                const saveBtn = document.getElementById('save-btn');
                const msg = document.getElementById('save-message');
                const originalHtml = saveBtn.innerHTML;
                
                saveBtn.innerHTML = '<i class="fa-solid fa-spinner fa-spin"></i> Saving...';
                saveBtn.disabled = true;
                msg.classList.add('hidden');
                
                // Collect basic info
                const fName = document.getElementById('first-name').value;
                const lName = document.getElementById('last-name').value;
                const newPass = document.getElementById('new-password').value;
                const confPass = document.getElementById('confirm-password').value;
                
                const updatedName = fName + (lName ? ' ' + lName : '');
                
                let updates = {
                    data: { full_name: updatedName }
                };

                if (pendingAvatarUrl !== null) {
                    updates.data.avatar_url = pendingAvatarUrl === '' ? null : pendingAvatarUrl;
                }
                
                if (newPass) {
                    if (newPass !== confPass) {
                        msg.innerText = "Passwords do not match.";
                        msg.className = "text-sm mt-3 text-red-600 block";
                        saveBtn.innerHTML = originalHtml;
                        saveBtn.disabled = false;
                        return;
                    }
                    updates.password = newPass;
                }

                try {
                    const { data, error } = await supabase.auth.updateUser(updates);
                    
                    if (error) throw error;
                    
                    msg.innerText = "Profile updated successfully!";
                    msg.className = "text-sm mt-3 text-green-600 block";
                    
                    if(newPass) {
                        document.getElementById('current-password').value = '';
                        document.getElementById('new-password').value = '';
                        document.getElementById('confirm-password').value = '';
                    }

                    // Update sidebar immediately
                    const newFullName = data.user.user_metadata?.full_name || updatedName;
                     document.getElementById('sidebar-name').innerText = newFullName;
                    const newInitial = newFullName.charAt(0).toUpperCase();
                    const newAvatarUrl = data.user.user_metadata?.avatar_url;

                    if (newAvatarUrl) {
                        document.getElementById('sidebar-avatar').innerHTML = '';
                        document.getElementById('sidebar-avatar').style.backgroundImage = `url(${newAvatarUrl})`;
                        document.getElementById('sidebar-avatar').style.backgroundSize = 'cover';
                        document.getElementById('sidebar-avatar').style.backgroundPosition = 'center';

                        document.getElementById('profile-avatar-display').style.backgroundImage = `url(${newAvatarUrl})`;
                        document.getElementById('profile-initial').style.display = 'none';

                        document.getElementById('open-sidebar-btn').innerHTML = `
                            <div class="w-full h-full rounded-full bg-cover bg-center" style="background-image: url(${newAvatarUrl})"></div>
                            <span class="absolute right-0 top-12 w-max bg-slate-900 text-white text-[10px] px-2 py-1 rounded opacity-0 group-hover:opacity-100 transition-opacity">Profile</span>
                        `;
                    } else {
                        document.getElementById('sidebar-avatar').style.backgroundImage = '';
                        document.getElementById('sidebar-avatar').innerHTML = `<span class="font-bold font-sans">${newInitial}</span>`;
                        document.getElementById('profile-initial').style.display = 'block';
                        document.getElementById('profile-initial').innerText = newInitial;
                        document.getElementById('open-sidebar-btn').innerHTML = `
                            ${newInitial}
                            <span class="absolute right-0 top-12 w-max bg-slate-900 text-white text-[10px] px-2 py-1 rounded opacity-0 group-hover:opacity-100 transition-opacity">Profile</span>
                        `;
                    }
                    
                    pendingAvatarUrl = null;

                } catch (err) {
                    msg.innerText = "Error: " + err.message;
                    msg.className = "text-sm mt-3 text-red-600 block";
                } finally {
                    saveBtn.innerHTML = originalHtml;
                    saveBtn.disabled = false;
                }
            });
        });
