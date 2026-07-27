import { supabase } from "../supabase-config.js";

        let reservations = [];
        let inventory = [];
        let archivedReservations = [];
        let archivedInventory = [];
        let currentDate = new Date();
        let charts = {};
        
        // --- DEFINE FUNCTIONS GLOBALLY ---
        const injectGlobalModals = () => {
            if(document.getElementById('pgsoGlobalModals')) return;
            document.body.insertAdjacentHTML('beforeend', `
                <div id="pgsoGlobalModals">
                    <!-- Success/Alert Modal -->
                    <div id="pgsoAlertModal" class="hidden fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-[999] p-4 transition-opacity duration-300">
                        <div class="bg-white rounded-2xl shadow-2xl p-8 w-full max-w-sm relative text-center border-t-8 border-blue-600 mt-8">
                            <div class="absolute -top-10 left-1/2 -translate-x-1/2 w-20 h-20 bg-white rounded-full flex items-center justify-center shadow-md border-4 border-white">
                                <div class="w-14 h-14 bg-blue-600 rounded-full flex items-center justify-center" id="pgsoAlertIconWrap"><i class="fa-solid fa-check text-white text-2xl" id="pgsoAlertIcon"></i></div>
                            </div>
                            <h3 class="text-xl font-bold text-slate-800 mt-6 tracking-tight" id="pgsoAlertTitle">Success</h3>
                            <p class="text-sm text-slate-500 mt-2 font-medium" id="pgsoAlertMessage">Operation completed.</p>
                            <button onclick="document.getElementById('pgsoAlertModal').classList.add('hidden')" id="pgsoAlertBtn" class="w-full mt-8 bg-blue-600 hover:bg-blue-700 text-white font-bold py-3.5 rounded-xl uppercase tracking-wider text-sm transition shadow-md">Continue</button>
                        </div>
                    </div>
                    <!-- Confirm Modal -->
                    <div id="pgsoConfirmModal" class="hidden fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-[999] p-4 transition-opacity duration-300">
                        <div class="bg-white rounded-2xl shadow-2xl p-8 w-full max-w-sm relative text-center border-t-8 border-red-500 mt-8">
                            <div class="absolute -top-10 left-1/2 -translate-x-1/2 w-20 h-20 bg-white rounded-full flex items-center justify-center shadow-md border-4 border-white">
                                <div class="w-14 h-14 bg-red-500 rounded-full flex items-center justify-center"><i class="fa-solid fa-triangle-exclamation text-white text-xl"></i></div>
                            </div>
                            <h3 class="text-xl font-bold text-slate-800 mt-6 tracking-tight" id="pgsoConfirmTitle">Confirm Action</h3>
                            <p class="text-sm text-slate-500 mt-2 font-medium" id="pgsoConfirmMessage">Are you sure?</p>
                            <div class="flex gap-4 mt-8">
                                <button onclick="document.getElementById('pgsoConfirmModal').classList.add('hidden')" class="flex-1 py-3 border-2 border-slate-200 text-slate-600 hover:bg-slate-50 rounded-xl font-bold uppercase tracking-wider text-sm transition">Cancel</button>
                                <button id="pgsoConfirmBtn" class="flex-1 py-3 bg-red-500 hover:bg-red-600 text-white rounded-xl font-bold uppercase tracking-wider text-sm transition shadow-md">Confirm</button>
                            </div>
                        </div>
                    </div>
                </div>
            `);
        };
        document.addEventListener('DOMContentLoaded', injectGlobalModals);

        window.showAwesomeAlert = function(msg, isError = false, customTitle = null) {
            document.getElementById('pgsoAlertMessage').innerText = msg;
            document.getElementById('pgsoAlertTitle').innerText = customTitle ? customTitle : (isError ? "Error" : "Success");
            const iconWrap = document.getElementById('pgsoAlertIconWrap');
            const icon = document.getElementById('pgsoAlertIcon');
            const borderTop = document.querySelector('#pgsoAlertModal > div');
            const btn = document.getElementById('pgsoAlertBtn');
            if (isError) {
                iconWrap.className = 'w-14 h-14 bg-red-500 rounded-full flex items-center justify-center';
                icon.className = 'fa-solid fa-xmark text-white text-2xl';
                borderTop.className = 'bg-white rounded-2xl shadow-2xl p-8 w-full max-w-sm relative text-center border-t-8 border-red-500 mt-8';
                btn.className = 'w-full mt-8 bg-red-500 hover:bg-red-600 text-white font-bold py-3.5 rounded-xl uppercase tracking-wider text-sm transition shadow-md';
            } else {
                iconWrap.className = 'w-14 h-14 bg-blue-600 rounded-full flex items-center justify-center';
                icon.className = 'fa-solid fa-check text-white text-2xl';
                borderTop.className = 'bg-white rounded-2xl shadow-2xl p-8 w-full max-w-sm relative text-center border-t-8 border-blue-600 mt-8';
                btn.className = 'w-full mt-8 bg-blue-600 hover:bg-blue-700 text-white font-bold py-3.5 rounded-xl uppercase tracking-wider text-sm transition shadow-md';
            }
            document.getElementById('pgsoAlertModal').classList.remove('hidden');
        };

        window.showAwesomeConfirm = function(msg, callback, cancelCallback = null) {
            document.getElementById('pgsoConfirmMessage').innerText = msg;
            const btn = document.getElementById('pgsoConfirmBtn');
            btn.onclick = () => {
                document.getElementById('pgsoConfirmModal').classList.add('hidden');
                callback();
            };
            const cancelBtn = document.querySelector('#pgsoConfirmModal .flex.gap-4 button:first-child');
            if (cancelBtn) {
                cancelBtn.onclick = () => {
                    document.getElementById('pgsoConfirmModal').classList.add('hidden');
                    if (cancelCallback) cancelCallback();
                };
            }
            document.getElementById('pgsoConfirmModal').classList.remove('hidden');
        };
        window.logoutAdmin = async function() {
            await supabase.auth.signOut();
            window.location.href = "../admin-login/admin-login.html";
        };

        window.switchTab = function(t) {
            ['calendar','analytics','inventory','venues','archive'].forEach(id => {
                const sec = document.getElementById('section-'+id);
                if(sec) sec.classList.add('hidden');
                const tab = document.getElementById('tab-'+id);
                if(tab) tab.className = "w-full flex items-center gap-4 px-4 py-3.5 rounded-xl text-slate-400 hover:bg-white/5 hover:text-white transition font-medium tracking-wide";
            });
            document.getElementById('section-'+t).classList.remove('hidden');
            document.getElementById('tab-'+t).className = "w-full flex items-center gap-4 px-4 py-3.5 rounded-xl bg-blue-600/10 text-blue-500 font-bold tracking-wide transition";
            
            let title = "Calendar & Bookings";
            if(t==='analytics') title = "Analytics Dashboard";
            if(t==='inventory') title = "Equipment Management";
            if(t==='venues') title = "Venues & Facilities";
            if(t==='archive') title = "Archive Center";
            document.getElementById('dash-title').innerText = title;

            // Render content
            if(t === 'analytics') renderAnalytics();
            if(t === 'inventory') renderInventory();
            if(t === 'venues') window.renderVenues();
            if(t === 'archive') switchArchiveTab();
            
            // Auto-hide sidebar on mobile if a tab is clicked
            const sidebarBtn = document.getElementById('admin-sidebar-mobile-overlay');
            if (sidebarBtn && !document.getElementById('admin-sidebar').classList.contains('-translate-x-full')) {
                toggleSidebar();
            }
        };

        window.toggleSidebar = function() {
            const sidebar = document.getElementById('admin-sidebar');
            const overlay = document.getElementById('admin-sidebar-mobile-overlay');
            if (sidebar.classList.contains('-translate-x-full')) {
                sidebar.classList.remove('-translate-x-full');
                if(overlay) overlay.classList.remove('hidden');
            } else {
                sidebar.classList.add('-translate-x-full');
                if(overlay) overlay.classList.add('hidden');
            }
        }

        window.closeModal = function(id) { document.getElementById(id).classList.add('hidden'); };

        window.formatReservationDates = function(dateStr) {
            if (!dateStr) return 'N/A';
            const datesArray = dateStr.split(',').map(d => d.trim()).filter(d => d);
            if (datesArray.length === 0) return 'N/A';
            datesArray.sort();
            const objDates = datesArray.map(d => new Date(d + "T12:00:00"));
            
            const isConsecutive = (d1, d2) => {
                const diff = d2.getTime() - d1.getTime();
                let daysDiff = Math.round(diff / 86400000);
                return daysDiff === 1;
            };
            
            let groups = [];
            let currentGroup = [objDates[0]];
            
            for(let i=1; i<objDates.length; i++) {
                if(isConsecutive(objDates[i-1], objDates[i])) {
                    currentGroup.push(objDates[i]);
                } else {
                    groups.push(currentGroup);
                    currentGroup = [objDates[i]];
                }
            }
            groups.push(currentGroup);
            
            const formatGrp = (grp) => {
                const first = grp[0];
                const last = grp[grp.length-1];
                const m = first.toLocaleDateString('en-US', { month: 'long' });
                const y = first.toLocaleDateString('en-US', { year: 'numeric' });
                
                if (grp.length === 1) {
                    return `${m} ${first.getDate()}, ${y}`;
                } else {
                    const lastM = last.toLocaleDateString('en-US', { month: 'long' });
                    const lastY = last.toLocaleDateString('en-US', { year: 'numeric' });
                    if (y !== lastY) {
                        return `${m} ${first.getDate()}, ${y} - ${lastM} ${last.getDate()}, ${lastY}`;
                    } else if (m !== lastM) {
                        return `${m} ${first.getDate()} - ${lastM} ${last.getDate()}, ${y}`;
                    } else {
                        return `${m} ${first.getDate()}-${last.getDate()}, ${y}`;
                    }
                }
            };
            return groups.map(formatGrp).join(', ');
        };

        // --- 1. VIEW & EDIT RESERVATION LOGIC ---
        window.viewReservation = function(id) {
            const res = reservations.find(r => r.id === id);
            if(!res) return;

            document.getElementById('edit-res-id').value = res.id;
            document.getElementById('edit-name').value = res.contact.fullName;
            document.getElementById('edit-contact').value = res.contact.contactNumber;
            document.getElementById('edit-email').value = res.contact.email;
            document.getElementById('edit-venue').value = res.event.venue;
            document.getElementById('edit-type').value = res.event.eventType;
            document.getElementById('edit-dates').value = res.event.dates;
            
            if (!window.fpEditDatesInstance) {
                window.fpEditDatesInstance = flatpickr("#edit-dates", {
                    mode: "multiple",
                    dateFormat: "Y-m-d",
                    altInput: true,
                    altFormat: "F j, Y"
                });
            } else {
                window.fpEditDatesInstance.setDate(res.event.dates.split(', '));
            }
            document.getElementById('edit-start').value = res.event.startTime;
            document.getElementById('edit-end').value = res.event.endTime;
            document.getElementById('edit-status').value = res.status;
            document.getElementById('edit-price').value = res.pricing.grandTotal;
            document.getElementById('edit-notes').value = res.notes || "";

            let equipText = "None";
            if(res.equipment && res.equipment.length > 0) {
                equipText = res.equipment.map(e => `${e.qty}x ${e.name} (${e.unit})`).join('\n');
            }
            document.getElementById('edit-equipment-text').value = equipText;

            document.getElementById('reservationModal').classList.remove('hidden');
        };

        window.saveReservationChanges = async function(e) {
            e.preventDefault();
            const id = document.getElementById('edit-res-id').value;
            const submitBtn = e.target.querySelector('button[type="submit"]');
            const originalText = submitBtn.innerText;
            submitBtn.innerText = "Saving...";

            const res = reservations.find(r => r.id === id);
            try {
                const updatedContact = { 
                    ...res.contact, 
                    fullName: document.getElementById('edit-name').value,
                    contactNumber: document.getElementById('edit-contact').value,
                    email: document.getElementById('edit-email').value
                };
                
                const updatedEvent = {
                    ...res.event,
                    venue: document.getElementById('edit-venue').value,
                    eventType: document.getElementById('edit-type').value,
                    dates: document.getElementById('edit-dates').value,
                    startTime: document.getElementById('edit-start').value,
                    endTime: document.getElementById('edit-end').value
                };
                
                const updatedPricing = {
                    ...res.pricing,
                    grandTotal: parseFloat(document.getElementById('edit-price').value)
                };

                const { error } = await supabase.from('reservations').update({
                    contact: updatedContact,
                    event: updatedEvent,
                    pricing: updatedPricing,
                    status: document.getElementById('edit-status').value,
                    notes: document.getElementById('edit-notes').value
                }).eq('id', id);
                
                if (error) throw error;

                // Notify Client
                if (updatedContact.email) {
                     try {
                         await supabase.from('notifications').insert([{
                             user_email: updatedContact.email.toLowerCase(),
                             title: 'Reservation Updated',
                             message: `Your reservation details for ${updatedEvent.venue} has been modified by the administrator.`
                         }]);
                     } catch(e) { console.warn('Notification failed', e); }
                }

                fetchReservations(); // Sync immediately
                showAwesomeAlert("Reservation updated successfully!");
                closeModal('reservationModal');
            } catch (error) {
                console.error("Error updating:", error);
                showAwesomeAlert("Error saving changes: " + error.message, true);
            } finally {
                submitBtn.innerText = originalText;
            }
        };

        // --- PRINT FUNCTION ---
        // REPLACE your existing printReservation function in admin.html with this:

window.printReservation = function(id, event) {
    if(event) event.stopPropagation();
    const res = reservations.find(r => r.id === id);
    if(!res) { showAwesomeAlert("Reservation data not found.", true); return; }

    const printWindow = window.open('', '_blank', 'width=900,height=1100');
    
    // --- Helper to split equipment into two columns for the form ---
    const half = Math.ceil((res.equipment?.length || 0) / 2);
    const equipLeft = res.equipment ? res.equipment.slice(0, 5) : []; // First 5 items
    const equipRight = res.equipment ? res.equipment.slice(5, 10) : []; // Next 5 items
    
    // Helper to generate empty rows if list is short
    const fillRows = (arr, max) => {
        let html = '';
        // Add actual items
        arr.forEach(e => {
            html += `<tr><td>${e.name}</td><td class="center">${e.qty}</td><td class="center"></td></tr>`;
        });
        // Add blank rows to fill space
        for(let i=arr.length; i<max; i++) {
            html += `<tr><td>&nbsp;</td><td></td><td></td></tr>`;
        }
        return html;
    };

    // Determine which box to check
    const isPalispis = res.event.venue.includes("Palispis");
    const isGym = res.event.venue.includes("Gymnasium");
    const isPCL = res.event.venue.includes("PCL");
    
    // Date formatting
    const dateGen = new Date().toLocaleDateString('en-US', {year:'numeric', month:'long', day:'numeric'});

    const htmlContent = `
        <!DOCTYPE html>
        <html>
        <head>
            <title>Rental Form - ${res.contact.fullName}</title>
            <style>
                @page { size: A4; margin: 10mm; }
                body { font-family: 'Times New Roman', Times, serif; font-size: 11pt; color: #000; line-height: 1.3; max-width: 800px; margin: 0 auto; }
                
                /* HEADER */
                .header { text-align: center; margin-bottom: 20px; position: relative; }
                .header img { width: 70px; height: 70px; position: absolute; top: 0; }
                .header img.left { left: 40px; }
                .header img.right { right: 40px; }
                .header h3 { margin: 0; font-size: 10pt; font-weight: normal; }
                .header h2 { margin: 0; font-size: 12pt; font-weight: bold; }
                .form-title { text-align: center; font-weight: bold; border-top: 1px solid #000; border-bottom: 1px solid #000; padding: 5px; margin: 10px 0; font-size: 12pt; }
                
                /* META TOP RIGHT */
                .meta { text-align: right; font-size: 10pt; margin-bottom: 15px; }
                .meta div { margin-bottom: 4px; }
                
                /* ADDRESS BLOCK */
                .addressee { margin-bottom: 15px; font-weight: bold; }
                
                /* BODY TEXT */
                .body-text { text-align: justify; margin-bottom: 10px; text-indent: 30px; }
                .inline-input { border-bottom: 1px solid #000; padding: 0 5px; display: inline-block; min-width: 150px; text-align: center; font-weight: bold; }
                
                /* CHECKBOXES */
                .venues { display: flex; justify-content: space-around; margin: 10px 0 20px 0; padding: 0 20px; }
                .checkbox-item { display: flex; align-items: center; }
                .box { width: 14px; height: 14px; border: 1px solid #000; display: inline-block; margin-right: 5px; text-align: center; line-height: 12px; font-size: 12px; }
                
                /* TABLES */
                .equip-container { display: flex; gap: 20px; margin-bottom: 5px; }
                table { width: 100%; border-collapse: collapse; font-size: 10pt; }
                th, td { border: 1px solid #000; padding: 4px; }
                th { text-align: center; font-weight: bold; background: #f0f0f0; }
                td.center { text-align: center; }
                
                /* DETAILS */
                .details-section { margin-top: 10px; }
                .detail-row { margin-bottom: 5px; display: flex; }
                .detail-label { min-width: 130px; }
                .detail-line { flex-grow: 1; border-bottom: 1px solid #000; padding-left: 10px; font-weight: bold; }
                
                /* CLOSING */
                .closing { margin-top: 20px; text-align: right; }
                .closing-sig { margin-top: 30px; margin-right: 20px; font-weight: bold; border-top: 1px solid #000; display: inline-block; padding-top: 2px; text-align: center; min-width: 200px; }
                
                /* APPROVAL BOX */
                .approval-box { border: 1px solid #000; display: flex; margin-top: 20px; }
                .app-col { flex: 1; border-right: 1px solid #000; padding: 5px; font-size: 9pt; display: flex; flex-direction: column; justify-content: space-between; min-height: 80px; }
                .app-col:last-child { border-right: none; }
                .sig-center { text-align: center; margin-top: 30px; font-weight: bold; text-decoration: underline; }
                .sig-title { text-align: center; font-size: 8pt; }
                
                /* PROVISIONS */
                .provisions { font-size: 8pt; margin-top: 10px; text-align: justify; }
                .provisions ol { padding-left: 20px; margin: 0; }
                .provisions li { margin-bottom: 2px; }
                
                @media print { .no-print { display: none; } }
            </style>
        </head>
        <body>
            
            <div class="header">
                <img src="benguet.png" class="left" alt="Logo">
                <h3>Republic of the Philippines</h3>
                <h2>PROVINCE OF BENGUET</h2>
                <h3>Capitol, La Trinidad</h3>
                <img src="bagong-pilipinas.png" class="right" alt="Logo" onerror="this.style.display='none'">
            </div>

            <div class="form-title">RENTAL FORM<br><span style="font-size:10pt; font-weight:normal;">(FACILITY)</span></div>

            <div class="meta">
                <div>No.: ${res.reference_number || '______________'}</div>
                <div>Date: <u>${dateGen}</u></div>
            </div>

            <div class="addressee">
                HON. MELCHOR D. DICLAS<br>
                Province of Benguet<br>
                Capitol, La Trinidad, Benguet
            </div>

            <div class="body-text">
                The <span class="inline-input" style="min-width:250px"></span> of <span class="inline-input" style="min-width:200px"></span>
                and with contact number <span class="inline-input">${res.contact.contactNumber}</span> respectfully request for the use of the:
            </div>

            <div class="venues">
                <div class="checkbox-item"><span class="box">${isPalispis ? '✓' : '&nbsp;'}</span> Gov. Ben Palispis Auditorium</div>
                <div class="checkbox-item"><span class="box">${isGym ? '✓' : '&nbsp;'}</span> Provincial Gymnasium</div>
                <div class="checkbox-item"><span class="box">${isPCL ? '✓' : '&nbsp;'}</span> PCL Hall</div>
            </div>

            <div style="font-size:10pt; margin-bottom:2px;">Equipment Requested:</div>
            <div class="equip-container">
                <table>
                    <thead><tr><th>FACILITY/EQUIPMENT</th><th>QTY</th><th>NO. OF HRS</th></tr></thead>
                    <tbody>${fillRows(equipLeft, 5)}</tbody>
                </table>
                <table>
                    <thead><tr><th>FACILITY/EQUIPMENT</th><th>QTY</th><th>NO. OF HRS</th></tr></thead>
                    <tbody>${fillRows(equipRight, 5)}</tbody>
                </table>
            </div>

            <div style="font-size: 10pt; font-weight:bold; margin-bottom: 10px;">
                NOTE: Plus PHP 3,000.00 security deposit.<br>
                <div style="display:flex; gap:30px; margin-top:5px; font-weight:normal;">
                    <div style="display:flex; align-items:center;">
                        <span style="color:red; font-weight:bold; margin-right:5px;">**</span> 
                        <span class="box">${res.event.registrationFee === 'With Registration Fee' ? '✓' : ''}</span> With Registration Fee
                    </div>
                    <div style="display:flex; align-items:center;">
                        <span class="box">${res.event.registrationFee === 'Without Registration Fee' ? '✓' : ''}</span> Without Registration Fee
                    </div>
                </div>
            </div>

            <div class="details-section">
                <div class="detail-row">
                    <span class="detail-label">Inclusive date/s of use :</span>
                    <span class="detail-line">${window.formatReservationDates(res.event.dates)}</span>
                </div>
                <div class="detail-row">
                    <span class="detail-label">Inclusive time of use :</span>
                    <span class="detail-line">${res.event.startTime} - ${res.event.endTime} (${res.event.totalHours || 0} hours)</span>
                </div>
                <div class="detail-row">
                    <span class="detail-label">Purpose :</span>
                    <span class="detail-line">${res.event.eventType}</span>
                </div>
            </div>

            <div style="margin-top: 15px;">We shall appreciate your favorable action on this request.</div>

            <div class="closing">
                Very truly yours,<br><br>
                <div class="closing-sig">${res.contact.fullName.toUpperCase()}</div><br>
                <span style="font-size:9pt; margin-right:30px;">Signature over Printed Name and Date</span>
            </div>

            <div class="approval-box">
                <div class="app-col">
                    <div>Venue Available:</div>
                    <div class="sig-center">JENNIFER G. BAHOD</div>
                    <div class="sig-title">Provincial General Services Officer</div>
                </div>
                <div class="app-col">
                    <div>Approved by:</div>
                    <div class="sig-center">MELCHOR D. DICLAS, M.D.</div>
                    <div class="sig-title">Provincial Governor</div>
                </div>
                <div class="app-col">
                    <div>
                        Payment: Rent _______ Security _______<br>
                        Amount: <u>₱${res.pricing.grandTotal.toLocaleString()}</u><br>
                        OR No.: ____________
                    </div>
                    <div class="sig-center">______________________</div>
                    <div class="sig-title">PTO Representative</div>
                </div>
            </div>

            <div class="provisions">
                <strong>ADMINISTRATIVE PROVISIONS:</strong>
                <ol>
                    <li>The requesting party renting the facility shall provide adequate security to maintain peace and order. It shall maintain the cleanliness of the venue at all times.</li>
                    <li>Equipment and/or Facility must be clean after use.</li>
                    <li>Requesting party shall COORDINATE with the PGSO Custodian before their scheduled activity and to present the approved RENTAL FORM for coordination of the activity.</li>
                    <li>The requesting party shall pay the preparation day and should not exceed the date stated above, unless approved and have paid the corresponding rent.</li>
                    <li>Priority shall be given to government activities and functions.</li>
                    <li>Damages or losses of the facilities, equipment, or fixture, shall be the sole responsibility of the requesting party. He shall make necessary repair for damages and replace any equipment destroyed.</li>
                    <li>Security deposit of ₱3,000.00 will be collected to cover any extensions and/or damages incurred, and to be refunded after clearance from the personnel in charge.</li>
                    <li>The electricity consumption of any equipment being brought by the requesting party should pay the corresponding amount based on the computation of the electrical engineer.</li>
                    <li>Event and occasions that require a large audience or general entry are strongly discouraged in order to protect the facility and its equipment.</li>
                    <li>In case of cancellation, inform the office one week prior. Otherwise, paid rent is non-refundable.</li>
                    <li>When water & electricity supply is not available due to uncontrollable/unforeseen circumstances, the Benguet Provincial Government is NOT responsible to supply water & electricity.</li>
                </ol>
                <strong>I have read and understood the administrative provisions</strong>
            </div>

            <div class="no-print" style="text-align: center; margin-top: 20px;">
                <button onclick="window.print()" style="padding: 10px 20px; background-color: #3c5473; color: white; border: none; cursor: pointer;">Print Page</button>
            </div>

        </body>
        </html>
    `;

    printWindow.document.write(htmlContent);
    printWindow.document.close();
};

        // --- AUTO-CLEAN ARCHIVE ---
        const autoCleanArchive = async () => {
            try {
                const oneYearAgo = new Date();
                oneYearAgo.setFullYear(oneYearAgo.getFullYear() - 1);
                const isoDate = oneYearAgo.toISOString();
                
                // Delete reservations older than 1 year that are archived
                await supabase
                    .from('reservations')
                    .delete()
                    .eq('is_archived', true)
                    .lt('created_at', isoDate);
                    
                // Delete inventory older than 1 year that are archived
                await supabase
                    .from('inventory')
                    .delete()
                    .eq('is_archived', true)
                    .lt('created_at', isoDate);
            } catch (err) {
                console.error("Auto clean archive failed:", err);
            }
        };

        // Run cleanup once on admin dashboard load
        autoCleanArchive();

        // --- ADMIN NOTIFICATIONS ---
        const notifBtn = document.getElementById('admin-notif-btn');
        const notifDropdown = document.getElementById('admin-notif-dropdown');
        const notifList = document.getElementById('admin-notif-list');
        const notifBadge = document.getElementById('admin-notif-badge');
        
        if (notifBtn) {
            notifBtn.addEventListener('click', (e) => {
                e.preventDefault();
                e.stopPropagation();
                notifDropdown.classList.toggle('hidden');
            });
            document.addEventListener('click', (e) => {
                const wrapper = notifBtn.parentElement;
                if (!wrapper.contains(e.target)) notifDropdown.classList.add('hidden');
            });

            const renderAdminNotifs = (notifs) => {
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
                    el.innerHTML = `
                        <div class="flex justify-between items-start">
                            <span class="font-bold text-sm ${n.is_read ? 'text-slate-600' : 'text-slate-900'}">${n.title}</span>
                            ${!n.is_read ? '<span class="w-2 h-2 bg-blue-500 rounded-full mt-1.5 flex-shrink-0"></span>' : ''}
                        </div>
                        <p class="text-xs text-slate-500 line-clamp-2">${n.message}</p>
                    `;
                    notifList.appendChild(el);
                });
            };

            const fetchAdminNotifs = async () => {
                try {
                    const { data } = await supabase.from('notifications')
                        .select('*')
                        .is('user_email', null)
                        .order('created_at', { ascending: false })
                        .limit(20);
                    if (data) renderAdminNotifs(data);
                } catch(e) { console.error(e); }
            };

            document.getElementById('admin-mark-read').addEventListener('click', async (e) => {
                e.stopPropagation();
                const { error } = await supabase.from('notifications')
                    .update({ is_read: true })
                    .is('user_email', null)
                    .eq('is_read', false);
                if (!error) fetchAdminNotifs();
            });

            supabase.channel('admin-notifs')
                .on('postgres_changes', { event: '*', schema: 'public', table: 'notifications' }, () => {
                    fetchAdminNotifs();
                }).subscribe();

            fetchAdminNotifs();
        }

        // --- SUPABASE LISTENERS ---
        const fetchReservations = async () => {
            const { data } = await supabase.from('reservations').select('*');
            if (data) {
                reservations = data.filter(r => !r.is_archived);
                archivedReservations = data.filter(r => r.is_archived);
            } else {
                reservations = [];
                archivedReservations = [];
            }
            renderCalendar(); 
            const showDateStr = window.currentSelectedDateStr || new Date().toISOString().split('T')[0];
            renderReservationList(showDateStr);
            if (typeof window.renderAllReservations === 'function') window.renderAllReservations();
            renderAnalytics();
            if(!document.getElementById('section-inventory').classList.contains('hidden')) renderInventory();
            if(!document.getElementById('section-archive').classList.contains('hidden')) switchArchiveTab();
        };

        supabase.channel('reservations-channel')
            .on('postgres_changes', { event: '*', schema: 'public', table: 'reservations' }, () => {
                fetchReservations();
            }).subscribe();

        fetchReservations();

        // --- STATUS & DELETE ACTIONS ---
        window.setStatus = async function(id, status, event) {
            if(event) event.stopPropagation();
            
            // Optimistic update for immediate visual feedback
            const resIndex = reservations.findIndex(r => r.id === id);
            if (resIndex > -1) {
                reservations[resIndex].status = status;
                const showDateStr = window.currentSelectedDateStr || new Date().toISOString().split('T')[0];
                renderCalendar();
                renderReservationList(showDateStr);
                if (typeof window.renderAllReservations === 'function') window.renderAllReservations();
                renderAnalytics();
            }

            try { 
                const { error } = await supabase.from('reservations').update({ status: status }).eq('id', id); 
                if (error) throw error;
                if (status === 'confirmed' || status === 'declined') {
                    showAwesomeAlert(`Reservation ${status} successfully!`);
                    
                    // Dispatch notification to the client
                    if (resIndex > -1 && reservations[resIndex].contact?.email) {
                        try {
                            await supabase.from('notifications').insert([{
                                user_email: reservations[resIndex].contact.email.toLowerCase(),
                                title: `Reservation ${status.toUpperCase()}`,
                                message: `Your reservation for ${reservations[resIndex].event?.venue} on ${window.formatReservationDates(reservations[resIndex].event?.dates)} was ${status}.`
                            }]);
                        } catch(e) { console.warn('Notification failed', e); }
                    }
                }
            }
            catch(e) { 
                showAwesomeAlert("Error updating status: " + e.message, true); 
                fetchReservations(); // Revert on failure
            }
        };

        window.deleteRes = async function(id, event) {
            if(event) event.stopPropagation();
            showAwesomeConfirm("Send this reservation to the archive?", async () => {
                // Optimistic update
                const resIndex = reservations.findIndex(r => r.id === id);
                if (resIndex > -1) {
                    const removed = reservations.splice(resIndex, 1)[0];
                    removed.is_archived = true;
                    archivedReservations.push(removed);
                    const showDateStr = window.currentSelectedDateStr || new Date().toISOString().split('T')[0];
                    renderCalendar();
                    renderReservationList(showDateStr);
                    if (typeof window.renderAllReservations === 'function') window.renderAllReservations();
                    renderAnalytics();
                    if(document.getElementById('section-archive') && !document.getElementById('section-archive').classList.contains('hidden')) {
                        if (typeof switchArchiveTab === 'function') switchArchiveTab();
                    }
                }

                try { 
                    const { error } = await supabase.from('reservations').update({ is_archived: true }).eq('id', id);
                    if (error) throw error;
                    showAwesomeAlert("Reservation sent to archive.");
                    
                    if (resIndex > -1 && reservations[resIndex].contact?.email) {
                        try {
                            await supabase.from('notifications').insert([{
                                user_email: reservations[resIndex].contact.email.toLowerCase(),
                                title: 'Reservation Archived Update',
                                message: `Your reservation for ${reservations[resIndex].event?.venue} was moved to the archive by the administrator.`
                            }]);
                        } catch(e) { console.warn('Notification failed', e); }
                    }
                }
                catch(e) { 
                    showAwesomeAlert("Error: " + e.message, true); 
                    fetchReservations(); // Revert on failure
                }
            });
        };

        // --- CALENDAR LOGIC ---
        function renderCalendar() {
            const grid = document.getElementById('calendar-grid');
            const monthTitle = document.getElementById('currentMonthYear');
            grid.innerHTML = "";
            monthTitle.innerText = currentDate.toLocaleDateString('en-US', { month: 'long', year: 'numeric' });
            const year = currentDate.getFullYear();
            const month = currentDate.getMonth();
            const firstDay = new Date(year, month, 1).getDay();
            const daysInMonth = new Date(year, month + 1, 0).getDate();

            for(let i=0; i<firstDay; i++) grid.appendChild(document.createElement('div'));
            for(let i=1; i<=daysInMonth; i++) {
                const cell = document.createElement('div');
                cell.className = "cal-cell";
                cell.innerText = i;
                const dateStr = `${year}-${String(month+1).padStart(2,'0')}-${String(i).padStart(2,'0')}`;
                const events = reservations.filter(r => r.event.dates && r.event.dates.includes(dateStr));
                if(events.length > 0) {
                    cell.classList.add('has-event');
                    if (events.every(e => e.event.eventType && e.event.eventType.startsWith('Blocked:'))) {
                        cell.classList.add('status-declined'); // using red/declined style for blocked
                    }
                    else if(events.some(e => e.status === 'declined')) cell.classList.add('status-declined');
                    else if(events.some(e => e.status === 'pending')) cell.classList.add('status-pending');
                    else cell.classList.add('status-confirmed');
                }
                if (window.isBlockingMode && window.blockingSelectedDates && window.blockingSelectedDates.includes(dateStr)) {
                    cell.classList.add('bg-slate-600', 'text-white');
                }

                cell.onclick = () => {
                    if (window.isBlockingMode) {
                        const idx = window.blockingSelectedDates.indexOf(dateStr);
                        if (idx > -1) {
                            window.blockingSelectedDates.splice(idx, 1);
                            cell.classList.remove('bg-slate-600', 'text-white');
                        } else {
                            window.blockingSelectedDates.push(dateStr);
                            cell.classList.add('bg-slate-600', 'text-white');
                        }
                    } else {
                        document.querySelectorAll('.cal-cell').forEach(c => c.classList.remove('cal-selected'));
                        cell.classList.add('cal-selected');
                        window.currentSelectedDateStr = dateStr;
                        renderReservationList(dateStr);
                    }
                };
                grid.appendChild(cell);
            }
        }
        document.getElementById('prevMonth').onclick = () => { currentDate.setMonth(currentDate.getMonth()-1); renderCalendar(); };
        document.getElementById('nextMonth').onclick = () => { currentDate.setMonth(currentDate.getMonth()+1); renderCalendar(); };

        // --- SIDEBAR LIST ---
        function renderReservationList(dateStr) {
            const list = document.getElementById('reservation-list');
            const displayDate = new Date(dateStr);
            if (!isNaN(displayDate)) { document.getElementById('selected-date-display').innerText = displayDate.toLocaleDateString('en-US', {weekday:'short', month:'long', day:'numeric'}); }
            list.innerHTML = "";
            const matches = reservations.filter(r => r.event.dates && r.event.dates.includes(dateStr));
            if(matches.length === 0) { list.innerHTML = `<div class="h-full flex flex-col items-center justify-center text-gray-400"><p>No reservations.</p></div>`; return; }
            matches.forEach(res => {
                const card = document.createElement('div');
                card.className = "border border-gray-200 rounded-lg p-4 hover:shadow-md transition bg-white cursor-pointer relative group";
                card.onclick = () => viewReservation(res.id);
                let badge = res.status === 'pending' ? "bg-yellow-100 text-yellow-800" : res.status === 'confirmed' ? "bg-green-100 text-green-800" : "bg-red-100 text-red-800";
                if (res.event.eventType && res.event.eventType.startsWith('Blocked:')) {
                    badge = "bg-slate-200 text-slate-800";
                }
                card.innerHTML = `
                    <div class="flex justify-between items-start mb-2">
                        <div><h4 class="font-bold text-gray-900 group-hover:text-pgso-blue transition">${res.contact.fullName}</h4><p class="text-xs text-gray-500">${res.event.venue}</p></div>
                        <span class="${badge} text-[10px] px-2 py-1 rounded uppercase font-bold tracking-wider">${res.event.eventType && res.event.eventType.startsWith('Blocked:') ? 'BLOCKED' : res.status}</span>
                    </div>
                    <div class="text-xs text-gray-600 space-y-1 mb-3 pt-2 border-t border-gray-100">
                        <p><strong>Time:</strong> ${res.event.startTime} - ${res.event.endTime}</p>
                        <p><strong>Total:</strong> ₱${(res.pricing.grandTotal).toLocaleString()}</p>
                    </div>
                    <div class="flex gap-2 relative z-10">
                        ${(res.status === 'pending' && (!res.event.eventType || !res.event.eventType.startsWith('Blocked:'))) ? `<button onclick="setStatus('${res.id}', 'confirmed', event)" class="flex-1 bg-green-600 text-white py-1.5 rounded text-xs font-bold hover:bg-green-700">Accept</button><button onclick="setStatus('${res.id}', 'declined', event)" class="flex-1 bg-red-500 text-white py-1.5 rounded text-xs font-bold hover:bg-red-600">Decline</button>` : ''}
                        ${(res.status === 'confirmed' && (!res.event.eventType || !res.event.eventType.startsWith('Blocked:'))) ? `<button onclick="printReservation('${res.id}', event)" class="px-3 border border-gray-200 rounded text-blue-600 hover:text-blue-800 hover:bg-blue-50" title="Print Permit"><i class="fa-solid fa-print"></i></button>` : ''}
                        <button onclick="deleteRes('${res.id}', event)" title="${(res.event.eventType && res.event.eventType.startsWith('Blocked:')) ? 'Unblock Date' : 'Archive Reservation'}" class="px-3 border border-gray-200 rounded ${(res.event.eventType && res.event.eventType.startsWith('Blocked:')) ? 'text-red-500 hover:text-red-700 hover:bg-red-50' : 'text-amber-500 hover:text-amber-700 hover:bg-amber-50'}"><i class="fa-solid ${res.event.eventType && res.event.eventType.startsWith('Blocked:') ? 'fa-unlock' : 'fa-box-archive'}"></i></button>
                    </div>
                `;
                list.appendChild(card);
            });
        }

        window.renderAllReservations = function() {
            const tbody = document.getElementById('all-reservations-tbody');
            if (!tbody) return;
            const filter = document.getElementById('filter-all-reservations')?.value || 'all';
            const searchQuery = document.getElementById('search-all-reservations')?.value.toLowerCase().trim() || '';
            
            let filtered = reservations.filter(r => r.status === 'pending' || r.status === 'confirmed' || r.status === 'declined');
            if (filter !== 'all') {
                filtered = filtered.filter(r => r.status === filter);
            }
            if (searchQuery) {
                filtered = filtered.filter(r => r.contact?.fullName?.toLowerCase().includes(searchQuery));
            }
            
            filtered.sort((a, b) => {
                const dateA = new Date(a.created_at || a.timestamp || 0);
                const dateB = new Date(b.created_at || b.timestamp || 0);
                return dateB - dateA;
            });

            tbody.innerHTML = '';
            
            if (filtered.length === 0) {
                tbody.innerHTML = `<tr><td colspan="7" class="text-center py-8 text-slate-400">No reservations found.</td></tr>`;
                return;
            }

            filtered.forEach(res => {
                const tr = document.createElement('tr');
                tr.className = "hover:bg-slate-50 border-b border-gray-50 transition";
                
                let badge = res.status === 'pending' ? "bg-yellow-100 text-yellow-800 border-yellow-200" : 
                            res.status === 'confirmed' ? "bg-green-100 text-green-800 border-green-200" : 
                            "bg-red-100 text-red-800 border-red-200";

                const grandTotal = res.pricing && res.pricing.grandTotal ? `₱${parseFloat(res.pricing.grandTotal).toLocaleString('en-US', { minimumFractionDigits: 2 })}` : '₱0.00';
                
                let actionsStr = `<div class="flex justify-end gap-2">`;
                actionsStr += `<button onclick="viewReservation('${res.id}')" class="px-3 border border-gray-200 rounded text-blue-600 hover:text-blue-800 hover:bg-blue-50 py-1 font-bold text-xs" title="View Details"><i class="fa-solid fa-eye"></i></button>`;
                
                if(res.status === 'pending') {
                    actionsStr += `<button onclick="setStatus('${res.id}', 'confirmed', event)" class="px-3 border border-green-200 rounded text-green-700 bg-green-50 hover:bg-green-100 py-1 font-bold text-xs" title="Approve"><i class="fa-solid fa-check"></i></button>`;
                    actionsStr += `<button onclick="setStatus('${res.id}', 'declined', event)" class="px-3 border border-red-200 rounded text-red-700 bg-red-50 hover:bg-red-100 py-1 font-bold text-xs" title="Decline"><i class="fa-solid fa-xmark"></i></button>`;
                } else if(res.status === 'confirmed') {
                    actionsStr += `<button onclick="printReservation('${res.id}', event)" class="px-3 border border-gray-200 rounded text-slate-600 hover:text-blue-700 hover:bg-blue-50 py-1 font-bold text-xs" title="Print Form"><i class="fa-solid fa-print"></i></button>`;
                }
                actionsStr += `</div>`;

                let reasonHtml = '';
                if(res.status === 'cancelled' && res.notes) {
                    reasonHtml = `<div class="mt-2 text-[10px] text-red-600 leading-tight bg-red-50 p-1.5 rounded border border-red-100 text-left"><strong class="uppercase text-[8px] tracking-wider text-red-500 mb-0.5 block">Reason</strong>${res.notes}</div>`;
                }

                tr.innerHTML = `
                    <td class="px-4 py-3 align-top font-mono text-xs font-bold text-slate-600 tracking-wider">
                        ${res.reference_number || 'N/A'}
                    </td>
                    <td class="px-4 py-3 font-medium text-slate-800 align-top">
                        <div class="font-bold">${res.contact?.fullName || 'Unknown'}</div>
                        <div class="text-xs text-slate-500">${res.contact?.contactNumber || ''}</div>
                    </td>
                    <td class="px-4 py-3 align-top">
                        <div class="font-bold text-slate-700 line-clamp-1">${res.event?.venue || 'N/A'}</div>
                        <div class="text-xs text-slate-500 line-clamp-1">${res.event?.eventType || 'Event'}</div>
                    </td>
                    <td class="px-4 py-3 text-sm align-top">
                        <div class="font-bold text-slate-700 line-clamp-1">${window.formatReservationDates(res.event?.dates)}</div>
                        <div class="text-xs text-slate-500">${res.event?.startTime || ''} - ${res.event?.endTime || ''}</div>
                    </td>
                    <td class="px-4 py-3 text-center align-top">
                        <span class="${badge} text-[10px] px-2 py-1 rounded uppercase font-bold tracking-wider inline-block border">${res.status}</span>
                        ${reasonHtml}
                    </td>
                    <td class="px-4 py-3 font-bold text-blue-700 text-right whitespace-nowrap align-top">
                        ${grandTotal}
                    </td>
                    <td class="px-4 py-3 text-right align-top">
                        ${actionsStr}
                    </td>
                `;
                tbody.appendChild(tr);
            });
        };

        window.filterFromAnalytics = function(status) {
            // First switch to calendar tab
            switchTab('calendar');
            // Then find the filter select
            const filterSelect = document.getElementById('filter-all-reservations');
            if(filterSelect) {
                filterSelect.value = status;
                if (typeof window.renderAllReservations === 'function') {
                    window.renderAllReservations();
                }
                setTimeout(() => {
                    filterSelect.scrollIntoView({ behavior: 'smooth', block: 'center' });
                }, 50);
            }
        };

        // Attach event listener for the dropdown filter
        document.addEventListener('DOMContentLoaded', () => {
            const filterSelect = document.getElementById('filter-all-reservations');
            if(filterSelect) {
                filterSelect.addEventListener('change', window.renderAllReservations);
            }
        });

        window.showMonthlyBreakdownModal = function(status) {
            const currentYear = new Date().getFullYear();
            const months = ['January','February','March','April','May','June','July','August','September','October','November','December'];
            const monthlyData = new Array(12).fill(0);
            
            reservations.forEach(r => {
                let include = false;
                if (status === 'all') {
                    if (r.status !== 'archived' && r.status !== 'rejected') include = true;
                } else if (status === 'pending') {
                    if (r.status === 'pending') include = true;
                } else if (status === 'declined') {
                    if (r.status === 'declined' || r.status === 'cancelled') include = true;
                }

                if (!include) return;

                let d = null;
                if(r.timestamp) {
                    d = r.timestamp.toDate ? r.timestamp.toDate() : new Date(r.timestamp); 
                } else if (r.event && r.event.dates) {
                    let firstDate = r.event.dates.split(',')[0].trim();
                    if(firstDate) d = new Date(firstDate);
                }
                
                if (d && d.getFullYear() === currentYear) {
                    monthlyData[d.getMonth()]++;
                }
            });

            const listDiv = document.getElementById('mb-list');
            listDiv.innerHTML = "";
            let total = 0;
            months.forEach((m, i) => {
                const count = monthlyData[i];
                const textColor = count > 0 ? "text-slate-800" : "text-slate-400";
                listDiv.innerHTML += `
                    <div class="flex justify-between items-center bg-slate-50 border border-slate-100 p-3 rounded-lg">
                        <span class="font-bold text-slate-600 text-sm">${m}</span>
                        <span class="font-black ${textColor} text-base">${count}</span>
                    </div>
                `;
                total += count;
            });
            
            // Add Total at the bottom
            listDiv.innerHTML += `
                <div class="flex justify-between items-center bg-blue-50 border border-blue-200 p-3 rounded-lg mt-4 sticky bottom-0">
                    <span class="font-bold text-blue-800 text-sm uppercase tracking-wider">Total</span>
                    <span class="font-black text-blue-800 text-lg">${total}</span>
                </div>
            `;

            const titleEl = document.getElementById('mb-title');
            const subtitleEl = document.getElementById('mb-subtitle');
            subtitleEl.innerText = `Monthly Breakdown (${currentYear})`;
            
            const iconWrap = document.getElementById('mb-icon-wrap');
            const icon = document.getElementById('mb-icon');
            const topBorder = document.querySelector('#monthlyBreakdownModal > div.bg-white');

            if (status === 'all') {
                titleEl.innerText = "Total Bookings";
                iconWrap.className = "w-14 h-14 bg-blue-600 rounded-full flex items-center justify-center";
                icon.className = "fa-solid fa-calendar-check text-white text-xl";
                topBorder.className = "bg-white rounded-2xl shadow-xl w-full max-w-sm relative flex flex-col mt-8 border-t-8 border-blue-600";
            } else if (status === 'pending') {
                titleEl.innerText = "Pending Bookings";
                iconWrap.className = "w-14 h-14 bg-yellow-500 rounded-full flex items-center justify-center";
                icon.className = "fa-solid fa-clock text-white text-xl";
                topBorder.className = "bg-white rounded-2xl shadow-xl w-full max-w-sm relative flex flex-col mt-8 border-t-8 border-yellow-500";
            } else if (status === 'declined') {
                titleEl.innerText = "Cancelled Bookings";
                iconWrap.className = "w-14 h-14 bg-red-500 rounded-full flex items-center justify-center";
                icon.className = "fa-solid fa-ban text-white text-xl";
                topBorder.className = "bg-white rounded-2xl shadow-xl w-full max-w-sm relative flex flex-col mt-8 border-t-8 border-red-500";
            }

            document.getElementById('monthlyBreakdownModal').classList.remove('hidden');
        };

        // --- ANALYTICS ---
        function renderAnalytics() {
            const confirmed = reservations.filter(r => r.status === 'confirmed').length;
            const pending = reservations.filter(r => r.status === 'pending').length;
            const declined = reservations.filter(r => r.status === 'declined').length;
            document.getElementById('stat-total-bookings').innerText = reservations.length;
            document.getElementById('stat-pending').innerText = pending;
            document.getElementById('stat-cancelled').innerText = declined;

            if(charts.venue) charts.venue.destroy();
            if(charts.line) charts.line.destroy();
            if(charts.forecast) charts.forecast.destroy();
            if(charts.runRate) charts.runRate.destroy();

            const venues_list = {};
            reservations.forEach(r => { venues_list[r.event.venue] = (venues_list[r.event.venue] || 0) + 1; });
            let topV = "N/A", max=0;
            for(let v in venues_list) { if(venues_list[v]>max){ max=venues_list[v]; topV=v; } }
            document.getElementById('stat-venue').innerText = topV;

            const ctxV = document.getElementById('venueChart');
            if(ctxV) {
                charts.venue = new Chart(ctxV.getContext('2d'), {
                    type: 'bar',
                    data: { labels: Object.keys(venues_list), datasets: [{ label: 'Bookings', data: Object.values(venues_list), backgroundColor: '#3c5473' }] },
                    options: { responsive: true, maintainAspectRatio: false }
                });
            }

            const months = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];
            const monthlyData = new Array(12).fill(0);
            
            const currentYear = new Date().getFullYear();
            const lastYear = currentYear - 1;

            const currentYearData = new Array(12).fill(0);
            const lastYearData = new Array(12).fill(0);

            reservations.forEach(r => {
                let d = null;
                if(r.timestamp) {
                    d = r.timestamp.toDate ? r.timestamp.toDate() : new Date(r.timestamp); 
                } else if (r.event && r.event.dates) {
                    let firstDate = r.event.dates.split(',')[0].trim();
                    if(firstDate) d = new Date(firstDate);
                }
                
                if(d) {
                    monthlyData[d.getMonth()]++;
                    if(d.getFullYear() === currentYear) currentYearData[d.getMonth()]++;
                    else if(d.getFullYear() === lastYear) lastYearData[d.getMonth()]++;
                }
            });

            const ctxL = document.getElementById('lineChart');
            if(ctxL) {
                charts.line = new Chart(ctxL.getContext('2d'), {
                    type: 'line',
                    data: { labels: months, datasets: [{ label: 'Reservations', data: monthlyData, borderColor: '#8b5cf6', tension: 0.3, fill: true, backgroundColor: 'rgba(139, 92, 246, 0.1)' }] },
                    options: { responsive: true, maintainAspectRatio: false }
                });
            }

            // --- FORECAST CHART ---
            const currentMonthIdx = new Date().getMonth();
            let n = 0, sumX = 0, sumY = 0, sumXY = 0, sumXX = 0;
            
            for(let i = 0; i < 4; i++) {
                let mIdx = (currentMonthIdx - i + 12) % 12;
                let x = 4 - i; 
                let y = currentYearData[mIdx];
                if (y > 0 || i === 0) {
                    n++; sumX += x; sumY += y; sumXY += x * y; sumXX += x * x;
                }
            }
            
            let m_slope = 0;
            let b = sumY / (n || 1); 
            if (n > 1) {
                const denominator = (n * sumXX - sumX * sumX);
                if(denominator !== 0) {
                    m_slope = (n * sumXY - sumX * sumY) / denominator;
                    b = (sumY - m_slope * sumX) / n;
                }
            }

            const forecastData = new Array(12).fill(null);
            forecastData[currentMonthIdx] = currentYearData[currentMonthIdx];
            
            for(let i = 1; i <= 6; i++) {
                if (currentMonthIdx + i < 12) {
                    let nextMIdx = currentMonthIdx + i;
                    let nextX = 4 + i;
                    let predicted = Math.max(0, Math.round(m_slope * nextX + b)); 
                    if (n <= 1 && predicted === 0) predicted = Math.max(2, Math.round((currentYearData[currentMonthIdx]||1) * 1.1)); 
                    forecastData[nextMIdx] = predicted;
                }
            }

            // Cap future months as null in currentYearData so graph matches visual style
            for(let i = currentMonthIdx + 1; i < 12; i++) currentYearData[i] = null;

            const ctxF = document.getElementById('forecastChart');
            if(ctxF) {
                charts.forecast = new Chart(ctxF.getContext('2d'), {
                    type: 'line',
                    data: { 
                        labels: months, 
                        datasets: [
                            { label: `${lastYear}`, data: lastYearData, borderColor: '#3b82f6', tension: 0.3, fill: false },
                            { label: `${currentYear}`, data: currentYearData, borderColor: '#ea580c', tension: 0.3, fill: false },
                            { label: 'Forecast', data: forecastData, borderColor: '#9ca3af', tension: 0.3, fill: false, borderDash: [5, 5] }
                        ] 
                    },
                    options: { 
                        responsive: true, 
                        maintainAspectRatio: false,
                        plugins: { legend: { position: 'bottom' } }
                    }
                });
            }

            // --- RUN RATE CHART ---
            const monthlyRevenue = new Array(12).fill(0);
            let lastYearTotalRev = 0;

            reservations.forEach(r => {
                if (r.status === 'declined' || r.status === 'cancelled' || r.status === 'rejected') return;
                
                let d = null;
                if(r.timestamp) {
                    d = r.timestamp.toDate ? r.timestamp.toDate() : new Date(r.timestamp);
                } else if (r.event && r.event.dates) {
                    let firstDate = r.event.dates.split(',')[0].trim();
                    if(firstDate) d = new Date(firstDate);
                }
                
                if(d) {
                    let rev = r.pricing ? (r.pricing.grandTotal || 0) : 0;
                    if(d.getFullYear() === currentYear) monthlyRevenue[d.getMonth()] += rev;
                    else if(d.getFullYear() === lastYear) lastYearTotalRev += rev;
                }
            });

            let cumActuals = [];
            let currentCum = 0;
            for(let i=0; i<=currentMonthIdx; i++) {
                currentCum += monthlyRevenue[i];
                cumActuals.push(currentCum);
            }
            for(let i=currentMonthIdx+1; i<12; i++) cumActuals.push(null);

            const yearStart = new Date(currentYear, 0, 1);
            const now = new Date();
            const daysElapsed = Math.max(1, (now - yearStart) / (1000 * 60 * 60 * 24));
            const dailyRunRate = currentCum / daysElapsed;
            
            let cumProjected = new Array(12).fill(null);
            cumProjected[currentMonthIdx] = currentCum;
            let tempCum = currentCum;
            for(let i=currentMonthIdx+1; i<12; i++) {
                let daysInMonth = new Date(currentYear, i + 1, 0).getDate();
                tempCum += dailyRunRate * daysInMonth;
                cumProjected[i] = Math.round(tempCum);
            }

            if(lastYearTotalRev === 0) lastYearTotalRev = 50000;
            const targetTotal = lastYearTotalRev * 1.5; // Stretch goal plan
            let cumPlan = new Array(12).fill(0);
            for(let i=0; i<12; i++) {
                cumPlan[i] = Math.round((targetTotal / 12) * (i + 1));
            }

            const ctxR = document.getElementById('runRateChart');
            if(ctxR) {
                charts.runRate = new Chart(ctxR.getContext('2d'), {
                    type: 'line',
                    data: {
                        labels: months,
                        datasets: [
                            { label: 'Plan', data: cumPlan, borderColor: '#93c5fd', tension: 0.3, fill: false, borderDash: [5, 5] },
                            { label: 'What-if (Projected)', data: cumProjected, borderColor: '#ea580c', tension: 0.3, fill: false, borderDash: [5, 5] },
                            { label: 'Actuals', data: cumActuals, borderColor: '#3b82f6', tension: 0.3, fill: true, backgroundColor: 'rgba(59, 130, 246, 0.1)' }
                        ]
                    },
                    options: {
                        responsive: true,
                        maintainAspectRatio: false,
                        plugins: { legend: { position: 'bottom' } },
                        scales: {
                            y: {
                                ticks: { callback: function(value) { return '₱' + value.toLocaleString(); } }
                            }
                        }
                    }
                });
            }
        }

        // --- INVENTORY LOGIC (UPDATED WITH CATEGORY) ---
        const fetchInventory = async () => {
            const { data } = await supabase.from('inventory').select('*');
            if(data) {
                inventory = data.filter(i => !i.is_archived);
                archivedInventory = data.filter(i => i.is_archived);
            } else {
                inventory = [];
                archivedInventory = [];
            }
            renderInventory(); 
            if(!document.getElementById('section-archive').classList.contains('hidden')) switchArchiveTab();
        };

        supabase.channel('inventory-channel')
            .on('postgres_changes', { event: '*', schema: 'public', table: 'inventory' }, () => {
                fetchInventory();
            }).subscribe();

        fetchInventory();



function renderInventory() {
    const tbody = document.getElementById('inventory-table-body');
    tbody.innerHTML = "";
    const todayStr = new Date().toISOString().split('T')[0];
    
    // 1. Filter for reservations happening TODAY
    const activeRes = reservations.filter(r => 
        (r.status === 'confirmed' || r.status === 'pending') && 
        r.event.dates && r.event.dates.includes(todayStr)
    );

    // 2. SORTING LOGIC: Category Priority + Alphabetical
    const sortedInventory = [...inventory].sort((a, b) => {
        // Define Priority: 1=Equipment, 2=Service, 3=Package
        const getPriority = (cat) => {
            if (!cat || cat === 'equipment') return 1;
            if (cat === 'service') return 2;
            if (cat === 'package') return 3;
            return 4; // Others
        };

        const prioA = getPriority(a.category);
        const prioB = getPriority(b.category);

        // First, compare Priority
        if (prioA !== prioB) {
            return prioA - prioB; 
        }

        // If priority matches, sort Alphabetically by Name
        return a.name.localeCompare(b.name);
    });

    // 3. Loop through the SORTED list
    sortedInventory.forEach(item => {
        let used = 0;
        
        activeRes.forEach(r => {
            if (r.equipment) {
                const eq = r.equipment.find(e => {
                    if (e.id && item.id) return e.id === item.id;
                    return e.name === item.name;
                });
                if (eq) used += parseInt(eq.qty || 0);
            }
        });

        const avail = item.qty - used;
        const cat = item.category ? item.category.toUpperCase() : 'EQUIPMENT';
        const venue = item.venue || 'All Venues';
        
        // Define colors based on category
        let catColor = 'text-gray-500 bg-gray-100';
        if (cat === 'PACKAGE') catColor = 'text-purple-600 bg-purple-50';
        if (cat === 'SERVICE') catColor = 'text-orange-600 bg-orange-50';

        let venueBadge = venue === 'All Venues' ? '' : `<span class="text-[9px] font-bold px-2 py-0.5 rounded-full text-blue-700 bg-blue-50 border border-blue-100 uppercase tracking-widest block mt-1 w-max">${venue}</span>`;

        tbody.innerHTML += `
            <tr class="hover:bg-gray-50 border-b border-gray-50">
                <td class="px-4 py-3 font-medium">
                    <div class="flex items-center">
                        <span class="text-[10px] font-bold px-2 py-1 rounded ${catColor} mr-2 w-16 inline-block text-center flex-shrink-0">${cat}</span>
                        <div>
                            <span>${item.name}</span>
                            ${venueBadge}
                        </div>
                    </div>
                </td>
                <td class="px-4 py-3 text-gray-500">${item.unit}</td>
                <td class="px-4 py-3">₱${item.price}</td>
                <td class="px-4 py-3 text-center font-bold">${item.qty}</td>
                <td class="px-4 py-3 text-center text-orange-600">${used > 0 ? used : '-'}</td>
                <td class="px-4 py-3 text-center font-bold ${avail<=0?'text-red-600':'text-green-600'}">${avail}</td>
                <td class="px-4 py-3 text-right">
                    <button onclick="openInventoryModal('${item.id}')" class="text-blue-600 hover:underline text-xs mr-3 font-medium">Edit</button>
                    <button onclick="deleteInventoryItem('${item.id}')" class="text-amber-600 hover:underline text-xs font-medium"><i class="fa-solid fa-box-archive"></i> Archive</button>
                </td>
            </tr>
        `;
    });
}

        window.openInventoryModal = function(id=null) {
            document.getElementById('inventoryModal').classList.remove('hidden');
            if(id) {
                const item = inventory.find(i => i.id === id);
                document.getElementById('inv-modal-title').innerText = "Edit Item";
                document.getElementById('inv-id').value = item.id;
                document.getElementById('inv-category').value = item.category || 'equipment';
                document.getElementById('inv-venue').value = item.venue || 'All Venues';
                document.getElementById('inv-name').value = item.name;
                document.getElementById('inv-unit').value = item.unit;
                document.getElementById('inv-price').value = item.price;
                document.getElementById('inv-qty').value = item.qty;
            } else {
                document.getElementById('inv-modal-title').innerText = "Add Item";
                document.getElementById('inv-id').value = "";
                document.getElementById('inventory-form').reset();
                document.getElementById('inv-category').value = 'equipment';
                document.getElementById('inv-venue').value = 'All Venues';
            }
        };

        window.saveInventoryItem = async function(e) {
            e.preventDefault();
            const id = document.getElementById('inv-id').value;
            const btn = e.target.querySelector('button');
            const originalText = btn.innerText;
            btn.innerText = "Saving...";

            const itemData = {
                category: document.getElementById('inv-category').value,
                venue: document.getElementById('inv-venue').value,
                name: document.getElementById('inv-name').value.trim(),
                unit: document.getElementById('inv-unit').value.trim(),
                price: parseFloat(document.getElementById('inv-price').value),
                qty: parseInt(document.getElementById('inv-qty').value) 
            };

            try {
                if(id) {
                    const { error } = await supabase.from('inventory').update(itemData).eq('id', id);
                    if (error) throw error;
                } else {
                    const { error } = await supabase.from('inventory').insert([itemData]);
                    if (error) throw error;
                }
                
                await fetchInventory(); // Force immediate UI update
                
                document.getElementById('inventoryModal').classList.add('hidden');
                showAwesomeAlert("Inventory updated successfully!");
            } catch(err) {
                console.error(err);
                showAwesomeAlert("Error saving: " + err.message, true);
            } finally {
                btn.innerText = originalText;
            }
        };

        window.deleteInventoryItem = async function(id) {
            showAwesomeConfirm("Send this item to the archive?", async () => {
                try {
                    const { error } = await supabase.from('inventory').update({ is_archived: true }).eq('id', id);
                    if (error) throw error;
                    await fetchInventory(); // Force immediate UI update
                    showAwesomeAlert("Item sent to archive.");
                } catch(err) {
                    showAwesomeAlert("Error archiving: " + err.message, true);
                }
            });
        }

        // --- ARCHIVE LOGIC ---
        let currentArchiveTab = 'res';
        window.switchArchiveTab = function(tab = currentArchiveTab) {
            currentArchiveTab = tab;
            document.getElementById('archive-res-view').classList.add('hidden');
            document.getElementById('archive-inv-view').classList.add('hidden');
            document.getElementById('arch-tab-res').className = "bg-slate-100 text-slate-600 hover:bg-slate-200 px-5 py-2.5 rounded-xl text-xs font-bold uppercase tracking-wider transition shadow-sm";
            document.getElementById('arch-tab-inv').className = "bg-slate-100 text-slate-600 hover:bg-slate-200 px-5 py-2.5 rounded-xl text-xs font-bold uppercase tracking-wider transition shadow-sm";
            
            document.getElementById(`arch-tab-${tab}`).className = "bg-blue-600 text-white px-5 py-2.5 rounded-xl text-xs font-bold uppercase tracking-wider transition shadow-sm";
            document.getElementById(`archive-${tab}-view`).classList.remove('hidden');

            if(tab === 'res') renderArchiveReservations();
            if(tab === 'inv') renderArchiveInventory();
        };

        function renderArchiveReservations() {
            const tbody = document.getElementById('archive-res-tbody-list');
            tbody.innerHTML = "";
            if(archivedReservations.length === 0) {
                tbody.innerHTML = `<tr><td colspan="5" class="py-8 text-center text-slate-400 font-medium">No archived reservations.</td></tr>`;
                return;
            }
            archivedReservations.forEach(r => {
                let badge = r.status === 'pending' ? "bg-yellow-100 text-yellow-800" : r.status === 'confirmed' ? "bg-green-100 text-green-800" : "bg-red-100 text-red-800";
                tbody.innerHTML += `
                    <tr class="hover:bg-slate-50 transition">
                        <td class="py-4 px-5 align-top font-mono text-xs font-bold text-slate-600 tracking-wider">
                            ${r.reference_number || 'N/A'}
                        </td>
                        <td class="py-4 px-5">
                            <p class="font-bold text-slate-800">${r.contact.fullName}</p>
                            <p class="text-xs text-slate-500">${r.contact.email}</p>
                        </td>
                        <td class="py-4 px-5">
                            <p class="font-bold text-slate-800">${r.event.venue}</p>
                            <p class="text-xs text-slate-500">${window.formatReservationDates(r.event.dates)}</p>
                        </td>
                        <td class="py-4 px-5"><span class="${badge} text-[10px] px-2 py-1 rounded-md uppercase font-bold tracking-widest">${r.status}</span></td>
                        <td class="py-4 px-5 text-right flex justify-end gap-3">
                            <button onclick="restoreRecord('reservations', '${r.id}')" class="text-green-600 hover:text-green-800 text-xs font-bold uppercase tracking-wider flex items-center gap-1"><i class="fa-solid fa-rotate-left"></i> Restore</button>
                        </td>
                    </tr>
                `;
            });
        }

        function renderArchiveInventory() {
            const tbody = document.getElementById('archive-inv-tbody-list');
            tbody.innerHTML = "";
            if(archivedInventory.length === 0) {
                tbody.innerHTML = `<tr><td colspan="3" class="py-8 text-center text-slate-400 font-medium">No archived inventory.</td></tr>`;
                return;
            }
            archivedInventory.forEach(i => {
                const cat = (i.category || 'EQUIPMENT').toUpperCase();
                tbody.innerHTML += `
                    <tr class="hover:bg-slate-50 transition">
                        <td class="py-4 px-5 font-bold text-slate-800"><span class="text-[10px] px-2 py-1 rounded bg-slate-200 text-slate-600 mr-2">${cat}</span>${i.name}</td>
                        <td class="py-4 px-5 text-slate-500">${i.unit}</td>
                        <td class="py-4 px-5 text-right flex justify-end gap-3">
                            <button onclick="restoreRecord('inventory', '${i.id}')" class="text-green-600 hover:text-green-800 text-xs font-bold uppercase tracking-wider flex items-center gap-1"><i class="fa-solid fa-rotate-left"></i> Restore</button>
                        </td>
                    </tr>
                `;
            });
        }

        window.restoreRecord = async function(table, id) {
            showAwesomeConfirm("Restore this record back to active views?", async () => {
                try {
                    const { error } = await supabase.from(table).update({ is_archived: false }).eq('id', id);
                    if (error) throw error;
                    if(table === 'inventory') await fetchInventory(); else await fetchReservations();
                    showAwesomeAlert("Record restored successfully!");
                } catch(err) {
                    showAwesomeAlert("Error restoring: " + err.message, true);
                }
            });
        };



        window.openAddReservationModal = function() {
            document.getElementById('addResForm').reset();
            document.getElementById('addReservationModal').classList.remove('hidden');
            if (!window.fpDatesInstance) {
                window.fpDatesInstance = flatpickr("#add-dates", {
                    mode: "multiple",
                    dateFormat: "Y-m-d",
                    altInput: true,
                    altFormat: "F j, Y"
                });
            } else {
                window.fpDatesInstance.clear();
            }
        };

        async function generateReferenceNumber() {
            const now = new Date();
            const year = now.getFullYear();
            const yearPrefix = `${year}-F-`;

            const { data, error } = await supabase
                .from('reservations')
                .select('reference_number')
                .like('reference_number', `${yearPrefix}%`)
                .order('created_at', { ascending: false })
                .limit(1);

            let nextNum = 1;
            if (data && data.length > 0 && data[0].reference_number) {
                const lastRef = data[0].reference_number;
                const parts = lastRef.split('-'); 
                if(parts.length >= 4) {
                     const lastNum = parseInt(parts[3], 10);
                     if (!isNaN(lastNum)) {
                         nextNum = lastNum + 1;
                     }
                }
            }
            const month = String(now.getMonth() + 1).padStart(2, '0');
            return `${yearPrefix}${month}-${String(nextNum).padStart(3, '0')}`;
        }

        window.saveNewReservation = async function(e) {
            e.preventDefault();
            const btn = e.target.querySelector('button[type="submit"]');
            const originalText = btn.innerHTML;
            btn.innerHTML = '<i class="fa-solid fa-spinner fa-spin mr-2"></i> Saving...';
            btn.disabled = true;

            const name = document.getElementById('add-name').value;
            const contact = document.getElementById('add-contact').value;
            const email = document.getElementById('add-email').value;
            const venue = document.getElementById('add-venue').value;
            const type = document.getElementById('add-type').value;
            const dates = document.getElementById('add-dates').value;
            const start = document.getElementById('add-start').value;
            const end = document.getElementById('add-end').value;
            const price = parseFloat(document.getElementById('add-price').value) || 0;
            const notes = document.getElementById('add-notes').value;

            const refNum = await generateReferenceNumber();

            const reservationData = {
                reference_number: refNum,
                contact: { fullName: name, contactNumber: contact, email: email },
                event: { venue: venue, eventType: type, dates: dates, startTime: start, endTime: end },
                equipment: [],
                pricing: { grandTotal: price, venueTotal: price, equipmentTotal: 0, securityDeposit: 0 },
                notes: notes,
                status: 'confirmed'
            };

            try {
                const { error } = await supabase.from('reservations').insert([reservationData]);
                if (error) throw error;
                closeModal('addReservationModal');
                showAwesomeAlert("Block added to calendar successfully!");
                await fetchReservations();
            } catch (err) {
                showAwesomeAlert("Error saving reservation: " + err.message, true);
            } finally {
                btn.innerHTML = originalText;
                btn.disabled = false;
            }
        };

        // --- ADMIN BACK-BUTTON INTERCEPTOR ---
        history.pushState({ adminBase: true }, null, location.href);
        window.addEventListener('popstate', function (event) {
            if (event.state && event.state.adminBase) return;
            if (window.location.hash) return; // Ignore internal hash navigation

            showAwesomeConfirm("You went back. Do you want to securely log out?", async () => {
                await supabase.auth.signOut();
                window.location.href = "../index.html";
            }, () => {
                // If they cancel, restore the state so they can't go back without triggering this again
                history.pushState({ adminBase: true }, null, location.href);
            });
        });

        // --- VENUES SYSTEM ---
        let venuesList = [];
        let venueSelectedImages = [];

        function getFallbackVenues() {
            return [
                {
                    name: "Gov. Ben Palispis Auditorium",
                    category: "Auditorium",
                    description: "A premier auditorium ideal for large seminars, theatrical performances, and corporate gatherings. Features advanced acoustics and a spacious stage.",
                    capacity: 800,
                    price_first_4_hours: 1500,
                    price_succeeding_hour: 575,
                    price_daily: null,
                    security_deposit: 3000,
                    pricing_details: "₱1,500 first 4 hours, ₱575 per succeeding hour",
                    images: ["palispis.png", "palispis-2.png", "palispis-4.jpg"]
                },
                {
                    name: "Provincial Gymnasium",
                    category: "Sports Complex",
                    description: "A massive sports complex perfect for athletic tournaments, large assemblies, and community events. Features hardwood flooring and ample bleacher seating.",
                    capacity: 2500,
                    price_first_4_hours: 1500,
                    price_succeeding_hour: 400,
                    price_daily: null,
                    security_deposit: 3000,
                    pricing_details: "₱1,500 first 4 hours, ₱400 per succeeding hour",
                    images: ["gym-1.png", "gym-3.png", "gym-4.jpg"]
                },
                {
                    name: "PCL Hall",
                    category: "Conference Hall",
                    description: "An executive conference hall suited for high-level meetings, intimate workshops, and focused seminars. Features a professional environment and multimedia ready.",
                    capacity: 150,
                    price_first_4_hours: null,
                    price_succeeding_hour: null,
                    price_daily: 4000,
                    security_deposit: 3000,
                    pricing_details: "₱4,000 per day - Inclusive of sound system and projector",
                    images: ["pcl-hall.png", "pcl-2.png", "pcl-4.jpg"]
                }
            ];
        }

        const populateVenueSelects = () => {
            const addSelect = document.getElementById('add-venue');
            const invSelect = document.getElementById('inv-venue');
            
            if (addSelect) {
                addSelect.innerHTML = venuesList.map(v => `<option value="${v.name}">${v.name}</option>`).join('');
            }
            
            if (invSelect) {
                invSelect.innerHTML = `<option value="All Venues" class="font-bold text-blue-700">All Venues</option>` +
                    venuesList.map(v => `<option value="${v.name}">${v.name}</option>`).join('');
            }
        };

        window.fetchVenues = async function() {
            try {
                let { data, error } = await supabase.from('venues').select('*').order('name', { ascending: true });
                if (error) {
                    console.warn("Venues table error. Fallback loaded.", error);
                    venuesList = getFallbackVenues();
                    populateVenueSelects();
                    window.renderVenues();
                    return;
                }
                
                if (!data || data.length === 0) {
                    console.log("No venues found in DB. Seeding default 3...");
                    const fallback = getFallbackVenues();
                    const { error: seedError } = await supabase.from('venues').insert(fallback);
                    if (seedError) {
                        console.error("Seeding failed:", seedError);
                    } else {
                        let { data: seededData } = await supabase.from('venues').select('*').order('name', { ascending: true });
                        if (seededData) data = seededData;
                    }
                }
                
                venuesList = data || [];
                populateVenueSelects();
                window.renderVenues();
            } catch (err) {
                console.error("Venues fetch failed:", err);
                venuesList = getFallbackVenues();
                populateVenueSelects();
                window.renderVenues();
            }
        };

        window.openVenueModal = function() {
            document.getElementById('venueForm').reset();
            document.getElementById('venue-id').value = "";
            document.getElementById('venue-has-reg-fee').checked = false;
            document.getElementById('venueModalTitle').innerText = "Register New Venue";
            venueSelectedImages = [];
            renderVenueImagesPreview();
            document.getElementById('venueModal').classList.remove('hidden');
        };

        window.openEditVenueModal = function(id) {
            const venue = venuesList.find(v => v.id === id);
            if (!venue) return;

            document.getElementById('venue-id').value = venue.id;
            document.getElementById('venue-name').value = venue.name;
            document.getElementById('venue-category').value = venue.category;
            document.getElementById('venue-capacity').value = venue.capacity;
            document.getElementById('venue-description').value = venue.description || "";
            document.getElementById('venue-price-4h').value = venue.price_first_4_hours || "";
            document.getElementById('venue-price-ot').value = venue.price_succeeding_hour || "";
            document.getElementById('venue-price-daily').value = venue.price_daily || "";
            document.getElementById('venue-deposit').value = venue.security_deposit || 3000;
            document.getElementById('venue-pricing-details').value = venue.pricing_details || "";
            document.getElementById('venue-has-reg-fee').checked = venue.has_registration_fee || false;

            document.getElementById('venueModalTitle').innerText = "Edit Venue Details";
            venueSelectedImages = [...(venue.images || [])];
            renderVenueImagesPreview();
            document.getElementById('venueModal').classList.remove('hidden');
        };

        window.addVenueImageUrl = function() {
            const input = document.getElementById('venue-image-url');
            const url = input.value.trim();
            if (!url) return;
            venueSelectedImages.push(url);
            input.value = "";
            renderVenueImagesPreview();
        };

        window.removeVenueImage = function(index) {
            venueSelectedImages.splice(index, 1);
            renderVenueImagesPreview();
        };

        function renderVenueImagesPreview() {
            const preview = document.getElementById('venue-images-preview');
            if (!preview) return;
            preview.innerHTML = venueSelectedImages.map((img, idx) => {
                const src = img.startsWith('http') || img.includes('/') ? img : `../${img}`;
                return `
                    <div class="relative w-20 h-20 border border-slate-200 rounded-lg overflow-hidden group shadow-sm bg-slate-50 flex items-center justify-center">
                        <img src="${src}" class="w-full h-full object-cover" onerror="this.src='../pgso.png'">
                        <button type="button" onclick="window.removeVenueImage(${idx})" class="absolute top-1 right-1 w-5 h-5 bg-red-500 hover:bg-red-600 text-white rounded-full flex items-center justify-center shadow-md transition text-xs font-bold"><i class="fa-solid fa-xmark"></i></button>
                    </div>
                `;
            }).join('');
        }

        window.uploadVenueImage = async function() {
            const fileInput = document.getElementById('venue-image-file');
            const file = fileInput.files[0];
            if (!file) {
                showAwesomeAlert("Please select an image file to upload.", true);
                return;
            }

            const uploadBtn = document.querySelector('button[onclick="window.uploadVenueImage()"]');
            const originalText = uploadBtn.innerText;
            uploadBtn.innerText = "Uploading...";
            uploadBtn.disabled = true;

            try {
                const ext = file.name.split('.').pop();
                const pathName = `${Date.now()}-${Math.random().toString(36).substring(2, 9)}.${ext}`;

                const { data, error } = await supabase.storage
                    .from('venue-images')
                    .upload(pathName, file);

                if (error) throw error;

                const { data: { publicUrl } } = supabase.storage
                    .from('venue-images')
                    .getPublicUrl(pathName);

                venueSelectedImages.push(publicUrl);
                renderVenueImagesPreview();
                fileInput.value = "";
                showAwesomeAlert("Image uploaded successfully!");
            } catch (err) {
                console.error("Storage upload failed:", err);
                showAwesomeAlert("Upload failed. Make sure you have a public 'venue-images' bucket in Supabase storage, or paste a direct image URL instead.", true);
            } finally {
                uploadBtn.innerText = originalText;
                uploadBtn.disabled = false;
            }
        };

        window.saveVenue = async function(e) {
            e.preventDefault();
            const id = document.getElementById('venue-id').value;
            const submitBtn = document.getElementById('venue-submit-btn');
            const originalText = submitBtn.innerText;
            submitBtn.innerText = "Saving...";
            submitBtn.disabled = true;

            const name = document.getElementById('venue-name').value.trim();
            const category = document.getElementById('venue-category').value.trim();
            const capacity = parseInt(document.getElementById('venue-capacity').value);
            const description = document.getElementById('venue-description').value.trim();
            
            const price_4h_val = document.getElementById('venue-price-4h').value;
            const price_ot_val = document.getElementById('venue-price-ot').value;
            const price_daily_val = document.getElementById('venue-price-daily').value;
            
            const price_first_4_hours = price_4h_val ? parseFloat(price_4h_val) : null;
            const price_succeeding_hour = price_ot_val ? parseFloat(price_ot_val) : null;
            const price_daily = price_daily_val ? parseFloat(price_daily_val) : null;
            const security_deposit = parseFloat(document.getElementById('venue-deposit').value) || 3000;
            const has_registration_fee = document.getElementById('venue-has-reg-fee').checked;
            
            let pricing_details = document.getElementById('venue-pricing-details').value.trim();
            if (!pricing_details) {
                if (price_daily !== null) {
                    pricing_details = `₱${price_daily.toLocaleString()} per day`;
                } else if (price_first_4_hours !== null) {
                    pricing_details = `₱${price_first_4_hours.toLocaleString()} first 4 hours, ₱${(price_succeeding_hour || 0).toLocaleString()} per succeeding hour`;
                } else {
                    pricing_details = "Contact office for pricing";
                }
            }

            const venueData = {
                name,
                category,
                capacity,
                description,
                price_first_4_hours,
                price_succeeding_hour,
                price_daily,
                security_deposit,
                pricing_details,
                has_registration_fee,
                images: venueSelectedImages
            };

            try {
                let error;
                if (id) {
                    const response = await supabase.from('venues').update(venueData).eq('id', id);
                    error = response.error;
                } else {
                    const response = await supabase.from('venues').insert([venueData]);
                    error = response.error;
                }

                if (error) throw error;

                closeModal('venueModal');
                showAwesomeAlert("Venue details saved successfully!");
                await window.fetchVenues();
            } catch (err) {
                console.error("Error saving venue:", err);
                showAwesomeAlert("Error saving venue: " + err.message, true);
            } finally {
                submitBtn.innerText = originalText;
                submitBtn.disabled = false;
            }
        };

        window.deleteVenue = function(id) {
            const venue = venuesList.find(v => v.id === id);
            if (!venue) return;

            showAwesomeConfirm(`Are you sure you want to delete "${venue.name}"? This action cannot be undone.`, async () => {
                try {
                    const { error } = await supabase.from('venues').delete().eq('id', id);
                    if (error) throw error;
                    showAwesomeAlert("Venue deleted successfully!");
                    await window.fetchVenues();
                } catch (err) {
                    console.error("Error deleting venue:", err);
                    showAwesomeAlert("Error deleting venue: " + err.message, true);
                }
            });
        };

        window.renderVenues = function() {
            const container = document.getElementById('venues-list-container');
            if (!container) return;

            if (venuesList.length === 0) {
                container.innerHTML = `
                    <div class="col-span-full text-center py-12 text-slate-400">
                        <i class="fa-solid fa-hotel text-4xl mb-3 block"></i>
                        No venues registered yet. Click "Add Venue" to add one.
                    </div>
                `;
                return;
            }

            container.innerHTML = venuesList.map(venue => {
                const img = venue.images && venue.images.length > 0 ? venue.images[0] : 'pgso-building.jpg';
                const src = img.startsWith('http') || img.includes('/') ? img : `../${img}`;
                
                return `
                    <div class="bg-white border border-slate-200 rounded-xl overflow-hidden hover:shadow-lg transition flex flex-col group relative">
                        <div class="h-44 relative overflow-hidden">
                            <img src="${src}" onerror="this.src='../pgso-building.jpg'" class="w-full h-full object-cover">
                            <div class="absolute inset-0 bg-gradient-to-t from-slate-900/60 to-transparent"></div>
                            <div class="absolute bottom-3 left-4 text-white">
                                <span class="bg-blue-600 text-[10px] font-bold uppercase px-2 py-0.5 rounded shadow-sm inline-block mb-1">${venue.category}</span>
                                <h3 class="font-bold text-lg leading-tight">${venue.name}</h3>
                            </div>
                        </div>
                        <div class="p-6 flex-1 flex flex-col justify-between">
                            <div class="space-y-4">
                                <p class="text-xs text-slate-500 line-clamp-3 leading-relaxed font-light">${venue.description || 'No description provided.'}</p>
                                <div class="grid grid-cols-2 gap-4 text-xs font-semibold text-slate-700 bg-slate-50 p-3 rounded-lg border border-slate-100">
                                    <div class="flex items-center gap-1.5"><i class="fa-solid fa-users text-blue-600"></i> Max: ${venue.capacity}</div>
                                    <div class="flex items-center gap-1.5"><i class="fa-solid fa-shield-halved text-blue-600"></i> Dep: ₱${(venue.security_deposit || 0).toLocaleString()}</div>
                                </div>
                                <div class="border-t border-slate-100 pt-3">
                                    <span class="text-[10px] font-bold text-slate-400 uppercase tracking-widest block mb-0.5">Pricing Details</span>
                                    <span class="text-sm font-bold text-slate-800">${venue.pricing_details || 'N/A'}</span>
                                </div>
                            </div>
                            <div class="flex gap-3 pt-6 border-t border-slate-100 mt-6">
                                <button onclick="window.openEditVenueModal('${venue.id}')" class="flex-1 py-2 px-3 border border-slate-200 text-slate-700 hover:bg-slate-50 rounded-lg text-xs font-bold uppercase tracking-wider transition flex items-center justify-center gap-1.5"><i class="fa-solid fa-pencil"></i> Edit</button>
                                <button onclick="window.deleteVenue('${venue.id}')" class="flex-1 py-2 px-3 border border-red-200 text-red-600 hover:bg-red-50 rounded-lg text-xs font-bold uppercase tracking-wider transition flex items-center justify-center gap-1.5"><i class="fa-solid fa-trash-can"></i> Delete</button>
                            </div>
                        </div>
                    </div>
                `;
            }).join('');
        };

        // Venues Channel Setup & Initial Load
        supabase.channel('venues-channel')
            .on('postgres_changes', { event: '*', schema: 'public', table: 'venues' }, () => {
                window.fetchVenues();
            }).subscribe();

        window.fetchVenues();

        window.isBlockingMode = false;
        window.blockingSelectedDates = [];

        window.toggleBlockMode = function() {
            if (!window.isBlockingMode) {
                window.isBlockingMode = true;
                window.blockingSelectedDates = [];
                
                document.getElementById('btn-block-mode').className = "bg-green-600 hover:bg-green-700 text-white px-4 py-2.5 rounded-xl text-xs font-bold uppercase tracking-wider transition shadow-sm flex items-center";
                document.getElementById('text-block-mode').innerText = "Confirm Selection";
                document.getElementById('icon-block-mode').className = "fa-solid fa-check mr-2";
                
                document.getElementById('btn-cancel-block-mode').classList.remove('hidden');
                document.getElementById('btn-add-booking').classList.add('hidden');
                
                showAwesomeAlert("Click dates on the calendar to select them for blocking, then click 'Confirm Selection'.", false, "Blocking");
                renderCalendar();
            } else {
                if (window.blockingSelectedDates.length === 0) {
                    showAwesomeAlert("Please select at least one date on the calendar.", true);
                    return;
                }
                
                const select = document.getElementById('block-venue-select');
                select.innerHTML = '<option value="All Venues">All Venues</option>';
                supabase.from('venues').select('name').then(({data}) => {
                    if(data) {
                        data.forEach(v => {
                            select.innerHTML += `<option value="${v.name}">${v.name}</option>`;
                        });
                    }
                });
                
                window.blockingSelectedDates.sort();
                document.getElementById('block-date').value = window.blockingSelectedDates.join(', ');
                document.getElementById('block-date-display').value = window.formatReservationDates(window.blockingSelectedDates.join(', '));
                document.getElementById('block-reason').value = 'Holiday';
                
                document.getElementById('blockDateModal').classList.remove('hidden');
            }
        };

        window.cancelBlockMode = function() {
            window.isBlockingMode = false;
            window.blockingSelectedDates = [];
            
            document.getElementById('btn-block-mode').className = "bg-slate-600 hover:bg-slate-700 text-white px-4 py-2.5 rounded-xl text-xs font-bold uppercase tracking-wider transition shadow-sm flex items-center";
            document.getElementById('text-block-mode').innerText = "Block Date";
            document.getElementById('icon-block-mode').className = "fa-solid fa-ban mr-2";
            
            document.getElementById('btn-cancel-block-mode').classList.add('hidden');
            document.getElementById('btn-add-booking').classList.remove('hidden');
            
            renderCalendar();
        };

        window.saveBlockDate = async function(e) {
            e.preventDefault();
            const btn = document.getElementById('block-submit-btn');
            const origText = btn.innerText;
            btn.innerText = 'Saving...';
            
            const venue = document.getElementById('block-venue-select').value;
            const dateStr = document.getElementById('block-date').value;
            const reason = document.getElementById('block-reason').value.trim();
            
            if(!dateStr) {
                showAwesomeAlert("Please select at least one date.", true);
                btn.innerText = origText;
                return;
            }
            
            const reservationData = {
                contact: { fullName: 'System Admin', contactNumber: '09000000000', email: 'admin@system.local' },
                event: { venue: venue, eventType: 'Blocked: ' + reason, dates: dateStr, startTime: '00:00', endTime: '23:59', durationLabel: 'Whole Day' },
                pricing: { grandTotal: 0, venueTotal: 0, equipmentTotal: 0, securityDeposit: 0 },
                equipment: [],
                status: 'confirmed',
                notes: 'Blocked by Admin'
            };
            
            try {
                const { error } = await supabase.from('reservations').insert([reservationData]);
                if(error) throw error;
                showAwesomeAlert('Date blocked successfully!');
                closeModal('blockDateModal');
                window.cancelBlockMode(); // resets the UI
                fetchReservations(); // re-render calendar
            } catch(err) {
                showAwesomeAlert('Error: ' + err.message, true);
            } finally {
                btn.innerText = origText;
            }
        };