import { supabase } from "../supabase-config.js";

    document.addEventListener('DOMContentLoaded', async function() {
        // --- CONSTANTS ---
        const OVERTIME_RATE = 575; 
        const SECURITY_DEPOSIT = 3000;
        const VENUE_NAME = "Gov. Ben Palispis Auditorium"; 
        
        // --- DOM ELEMENTS ---
        const allTextInputs = document.querySelectorAll('input[type="text"]');
        const nameInput = allTextInputs[0];
        const contactInput = allTextInputs[1];
        const eventTypeInput = allTextInputs[2];
        const emailInput = document.querySelector('input[type="email"]');
        const notesInput = document.querySelector('textarea');
        const durationRadios = document.getElementsByName('duration');
        const startTimeInput = document.getElementById('start-time');
        const endTimeInput = document.getElementById('end-time');
        const summaryBtn = document.querySelector('.save-btn'); 
        
        const servicesBody = document.getElementById('services-body');
        const packagesBody = document.getElementById('packages-body');
        const equipmentBody = document.getElementById('equipment-body');

        // Calendar Elements
        const calendarGrid = document.getElementById('calendar-grid');
        const currentMonthYear = document.getElementById('currentMonthYear');
        const prevMonthBtn = document.getElementById('prevMonth');
        const nextMonthBtn = document.getElementById('nextMonth');

        let currentDate = new Date();
        let today = new Date();
        let selectedDates = [];
        let BLOCKED_DATES = [];
        let globalInventory = [];

        // Helper to get ALL rows from ALL 3 tables at once
        function getAllRows() {
            return document.querySelectorAll('tbody tr');
        }

        // ==========================================
        // 1. IMPROVED EVENT LISTENERS (Delegation for all tables)
        // ==========================================
        const tables = [servicesBody, packagesBody, equipmentBody];
        
        tables.forEach(table => {
            if(table) {
                table.addEventListener('change', (e) => {
                    if(e.target.classList.contains('equipment-checkbox')) {
                        const row = e.target.closest('tr');
                        const isChecked = e.target.checked;
                        
                        // If it's the packages table, uncheck everything else first
                        if (table === packagesBody && isChecked) {
                            const allPackageRows = packagesBody.querySelectorAll('tr');
                            allPackageRows.forEach(pr => {
                                if (pr !== row) {
                                    const pCb = pr.querySelector('.equipment-checkbox');
                                    const pQty = pr.querySelector('.equipment-quantity');
                                    const pBtns = pr.querySelectorAll('.qty-btn');
                                    if (pCb && pCb.checked) {
                                        pCb.checked = false;
                                        pQty.disabled = true;
                                        if(pBtns) pBtns.forEach(btn => btn.disabled = true);
                                        pQty.value = 0;
                                    }
                                }
                            });
                        }
                        
                        const qtyInput = row.querySelector('.equipment-quantity');
                        const qtyBtns = row.querySelectorAll('.qty-btn');
                        qtyInput.disabled = !isChecked;
                        if(qtyBtns) qtyBtns.forEach(btn => btn.disabled = !isChecked);
                        qtyInput.value = isChecked ? 1 : 0;
                        calculateTotal();
                    }
                });

                table.addEventListener('input', (e) => {
                    if(e.target.classList.contains('equipment-quantity')) {
                        const input = e.target;
                        const max = parseInt(input.max) || Infinity;
                        const currentVal = parseInt(input.value) || 0;
                        if (currentVal > max) {
                            alert(`Sorry, only ${max} units are available.`);
                            input.value = max;
                        }
                        calculateTotal();
                    }
                });

                table.addEventListener('click', (e) => {
                    const btn = e.target.closest('.qty-btn');
                    if (btn && !btn.disabled) {
                        const row = btn.closest('tr');
                        const input = row.querySelector('.equipment-quantity');
                        const max = parseInt(input.max) || Infinity;
                        let currentVal = parseInt(input.value) || 0;
                        
                        if (btn.classList.contains('qty-plus') && currentVal < max) {
                            currentVal++;
                        } else if (btn.classList.contains('qty-minus') && currentVal > 0) {
                            currentVal--;
                        }
                        
                        input.value = currentVal;
                        input.dispatchEvent(new Event('input', { bubbles: true }));
                    }
                });
            }
        });

        // ==========================================
        // 2. LOAD INVENTORY (Split into 3 Sections)
        // ==========================================
        async function loadInventory() {
            try {
                const { data: snapshot, error } = await supabase.from('inventory').select('*');
                if (error) throw error;
                
                const activeInventory = snapshot.filter(item => 
                    !item.is_archived && 
                    (!item.venue || item.venue === 'All Venues' || item.venue === 'Gov. Ben Palispis Auditorium')
                );
                globalInventory = [];
                servicesBody.innerHTML = "";
                packagesBody.innerHTML = "";
                equipmentBody.innerHTML = "";

                if (!activeInventory || activeInventory.length === 0) {
                    equipmentBody.innerHTML = "<tr><td colspan='5' class='text-center p-4'>No items found.</td></tr>";
                    return;
                }

                activeInventory.forEach(item => {
                    globalInventory.push({ ...item });

                    // Create Row
                    const row = document.createElement('tr');
                    row.dataset.id = item.id;
                    row.dataset.price = item.price;
                    row.dataset.unit = item.unit;
                    row.dataset.name = item.name;
                    
                    row.innerHTML = `
                        <td class="p-4"><input type="checkbox" class="equipment-checkbox w-4 h-4 rounded"></td>
                        <td class="py-3 text-gray-900 equipment-name">${item.name}</td>
                        <td class="py-3">${item.unit}</td>
                        <td class="py-3">₱${item.price}</td>
                        <td class="py-3">
                            <div class="flex items-center justify-center space-x-2">
                                <button type="button" class="qty-btn qty-minus w-6 h-6 rounded-md bg-gray-200 text-gray-600 hover:bg-gray-300 disabled:opacity-50 flex items-center justify-center font-bold" disabled><i class="fa-solid fa-minus text-xs"></i></button>
                                <input type="number" min="0" value="0" class="equipment-quantity form-input w-12 rounded p-1 text-center border border-gray-200 hide-arrows" disabled>
                                <button type="button" class="qty-btn qty-plus w-6 h-6 rounded-md bg-gray-200 text-gray-600 hover:bg-gray-300 disabled:opacity-50 flex items-center justify-center font-bold" disabled><i class="fa-solid fa-plus text-xs"></i></button>
                            </div>
                        </td>
                    `;

                    // SORT BY CATEGORY FIELD
                    // IMPORTANT: You need to add a "category" field in your Firebase Items
                    // Values: 'service', 'package', 'equipment'
                    const cat = item.category ? item.category.toLowerCase() : 'equipment';

                    if (cat === 'service') {
                        servicesBody.appendChild(row);
                    } else if (cat === 'package') {
                        packagesBody.appendChild(row);
                    } else {
                        equipmentBody.appendChild(row);
                    }
                });
            } catch (error) {
                console.error("Error loading inventory:", error);
            }
        }

        // ==========================================
        // 3. CHECK AVAILABILITY
        // ==========================================
        async function updateInventoryLimits() {
            const allRows = getAllRows();
            
            // Step A: Reset UI
            allRows.forEach(row => {
                const nameCell = row.querySelector('.equipment-name');
                const cleanName = row.dataset.name;
                nameCell.innerHTML = cleanName;
                row.classList.remove('bg-gray-100', 'opacity-50');
                
                const checkbox = row.querySelector('.equipment-checkbox');
                const qtyInput = row.querySelector('.equipment-quantity');
                const qtyBtns = row.querySelectorAll('.qty-btn');
                
                if(!checkbox.checked) {
                   qtyInput.disabled = true;
                   qtyInput.value = 0;
                   if (qtyBtns) qtyBtns.forEach(btn => btn.disabled = true);
                }
            });

            if (selectedDates.length === 0) return;

            // Step B: Calculate Usage
            const { data: resSnapshot, error } = await supabase.from('reservations').select('*');
            if (error) { console.error(error); return; }
            const usageMap = {}; 

            resSnapshot.forEach(data => {
                    if (data.status !== 'declined' && data.event.dates && data.equipment) {
                        const bookedDates = data.event.dates.split(', ');
                        if (bookedDates.some(date => selectedDates.includes(date))) {
                            data.equipment.forEach(item => {
                                const key = item.id || item.name; 
                                if (!usageMap[key]) usageMap[key] = 0;
                                usageMap[key] += item.qty;
                            });
                        }
                    }
                });

            // Step C: Apply Limits
            allRows.forEach(row => {
                const itemId = row.dataset.id;
                const itemName = row.dataset.name;
                const dbItem = globalInventory.find(i => i.id === itemId);
                if(!dbItem) return;

                const maxStock = parseInt(dbItem.qty || 0);
                const usedStock = (usageMap[itemId] || 0) + (usageMap[itemName] || 0);
                const available = maxStock - usedStock;

                const qtyInput = row.querySelector('.equipment-quantity');
                const checkbox = row.querySelector('.equipment-checkbox');
                const nameCell = row.querySelector('.equipment-name');
                const qtyBtns = row.querySelectorAll('.qty-btn');

                qtyInput.max = available;

                if (available <= 0) {
                    checkbox.checked = false;
                    checkbox.disabled = true;
                    qtyInput.value = 0;
                    qtyInput.disabled = true;
                    if (qtyBtns) qtyBtns.forEach(btn => btn.disabled = true);
                    nameCell.innerHTML = `${itemName} <span class="text-red-500 text-xs font-bold">(Out of Stock)</span>`;
                    row.classList.add('bg-gray-100', 'opacity-50');
                } else {
                    if(checkbox.disabled) checkbox.disabled = false;
                    if (qtyBtns) qtyBtns.forEach(btn => btn.disabled = !checkbox.checked);
                    nameCell.innerHTML = `${itemName} <span class="text-green-600 text-xs">(${available} available)</span>`;
                    if (parseInt(qtyInput.value) > available) qtyInput.value = available;
                }
            });
            calculateTotal();
        }

        // ==========================================
        // 4. CALENDAR & BLOCKED DATES
        // ==========================================
        async function fetchBlockedDates() {
            const { data: querySnapshot, error } = await supabase
                .from('reservations')
                .select('*')
                .eq('event->>venue', VENUE_NAME);
            if (error) { console.error(error); return; }
            
            BLOCKED_DATES = [];
            querySnapshot.forEach((data) => {
                if (data.status !== 'declined' && data.event.dates) {
                    const datesArray = data.event.dates.split(', ');
                    datesArray.forEach(date => { if(!BLOCKED_DATES.includes(date)) BLOCKED_DATES.push(date); });
                }
            });
            renderCalendar();
        }

        function renderCalendar() {
            calendarGrid.innerHTML = "";
            currentMonthYear.innerText = currentDate.toLocaleDateString('en-US', { month: 'long', year: 'numeric' });
            const year = currentDate.getFullYear();
            const month = currentDate.getMonth(); 
            const firstDay = new Date(year, month, 1).getDay();
            const daysInMonth = new Date(year, month + 1, 0).getDate(); 

            for (let i = 0; i < firstDay; i++) calendarGrid.appendChild(document.createElement('div'));

            for (let i = 1; i <= daysInMonth; i++) {
                const dayCell = document.createElement('div');
                dayCell.classList.add('cal-cell');
                dayCell.innerText = i;
                const cellDateStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(i).padStart(2, '0')}`;
                
                if (new Date(year, month, i).setHours(0,0,0,0) < today.setHours(0,0,0,0)) {
                    dayCell.classList.add('cal-past');
                } else if (BLOCKED_DATES.includes(cellDateStr)) {
                    dayCell.classList.add('cal-reserved');
                } else {
                    dayCell.classList.add('cal-available');
                    if (selectedDates.includes(cellDateStr)) dayCell.classList.add('cal-selected');
                    dayCell.addEventListener('click', function() {
                        if (selectedDates.includes(cellDateStr)) {
                            selectedDates = selectedDates.filter(d => d !== cellDateStr);
                            this.classList.remove('cal-selected');
                        } else {
                            selectedDates.push(cellDateStr);
                            this.classList.add('cal-selected');
                        }
                        updateInventoryLimits();
                    });
                }
                calendarGrid.appendChild(dayCell);
            }
        }

        prevMonthBtn.addEventListener('click', () => { currentDate.setMonth(currentDate.getMonth() - 1); renderCalendar(); });
        nextMonthBtn.addEventListener('click', () => { currentDate.setMonth(currentDate.getMonth() + 1); renderCalendar(); });

        // ==========================================
        // 5. CALCULATE TOTAL
        // ==========================================
        function calculateTotal() {
            const totalDays = selectedDates.length || 0;
            let baseDuration = 0;
            let basePrice = 0;
            let durationLabel = "";

            const radio = document.querySelector('input[name="duration"]:checked');
            if (radio) {
                baseDuration = parseInt(radio.dataset.durationValue);
                durationLabel = radio.nextElementSibling.innerText.trim();
                basePrice = baseDuration === 4 ? 1500 : 3000;
            }

            let hours = baseDuration;
            let overtime = 0;

            if (startTimeInput.value && endTimeInput.value) {
                const s = new Date(`1970-01-01T${startTimeInput.value}Z`);
                const e = new Date(`1970-01-01T${endTimeInput.value}Z`);
                let diff = (e - s) / (1000 * 60 * 60);
                if (diff < 0) diff += 24;
                if (diff > 0) hours = diff;
                if (hours > baseDuration && baseDuration > 0) overtime = Math.ceil(hours - baseDuration) * OVERTIME_RATE;
            }

            const venueTotal = (basePrice + overtime) * (totalDays || 1);
            let equipTotal = 0;
            
            const allRows = getAllRows();
            allRows.forEach(row => {
                const cb = row.querySelector('.equipment-checkbox');
                const qtyInput = row.querySelector('.equipment-quantity');
                if (cb && cb.checked) {
                    const price = parseFloat(row.dataset.price);
                    const qty = parseInt(qtyInput.value) || 0;
                    const days = totalDays || 1;
                    
                    // Logic: Some items might be 'per day' even if venue is 'per hour'
                    // For Simplicity: 'hour' unit multiplies by event hours, others by days
                    if(row.dataset.unit.includes('hour')) {
                        const billingHours = Math.ceil(hours) > 0 ? Math.ceil(hours) : 1;
                        equipTotal += price * qty * billingHours * days;
                    } else {
                        equipTotal += price * qty * days;
                    }
                }
            });

            const subTotal = venueTotal + equipTotal;
            const total = subTotal + SECURITY_DEPOSIT;

            document.getElementById('days-reserved-display').textContent = `${totalDays} day(s)`;
            if(overtime > 0) {
                 document.getElementById('base-price-display').innerHTML = `₱${(basePrice * (totalDays||1)).toLocaleString()} <span class="text-xs text-red-500">(+₱${(overtime*(totalDays||1)).toLocaleString()} OT)</span>`;
            } else {
                 document.getElementById('base-price-display').textContent = `₱${venueTotal.toLocaleString()}`;
            }
            document.getElementById('equipment-cost-display').textContent = `₱${equipTotal.toLocaleString()}`;
            document.getElementById('subtotal-display').textContent = `₱${subTotal.toLocaleString()}`;
            document.getElementById('estimated-total-display').textContent = `₱${total.toLocaleString()}`;

            return { venueTotal, equipTotal, total, hours, durationLabel, totalDays };
        }

        // --- AUTO SUGGEST END TIME ---
        function autoUpdateEndTime() {
            if (startTimeInput.value) {
                const selectedRadio = document.querySelector('input[name="duration"]:checked');
                if (selectedRadio) {
                    const baseDuration = parseInt(selectedRadio.dataset.durationValue);
                    if (baseDuration && !isNaN(baseDuration)) {
                        const [hours, minutes] = startTimeInput.value.split(':').map(Number);
                        const startDate = new Date();
                        startDate.setHours(hours, minutes, 0, 0);
                        startDate.setHours(startDate.getHours() + baseDuration);
                        const endHours = String(startDate.getHours()).padStart(2, '0');
                        const endMinutes = String(startDate.getMinutes()).padStart(2, '0');
                        endTimeInput.value = `${endHours}:${endMinutes}`;
                    }
                }
            }
            calculateTotal();
        }

        // --- LISTENERS ---
        durationRadios.forEach(r => r.addEventListener('change', autoUpdateEndTime));
        startTimeInput.addEventListener('change', autoUpdateEndTime);
        endTimeInput.addEventListener('change', calculateTotal);

        // Clear validation highlights
        [nameInput, contactInput, emailInput, eventTypeInput, startTimeInput, endTimeInput].forEach(el => {
            if(el) {
                el.addEventListener('input', () => el.classList.remove('border-red-500', 'ring-2', 'ring-red-500', 'bg-red-50'));
                el.addEventListener('change', () => el.classList.remove('border-red-500', 'ring-2', 'ring-red-500', 'bg-red-50'));
            }
        });
        if(calendarGrid) {
            calendarGrid.addEventListener('click', () => calendarGrid.parentElement.classList.remove('border-red-500', 'ring-2', 'ring-red-500', 'bg-red-50'));
        }

        summaryBtn.addEventListener('click', (e) => {
            e.preventDefault();
            
            // Reset previous highlights
            const allInputsElements = [nameInput, contactInput, emailInput, eventTypeInput, startTimeInput, endTimeInput, calendarGrid.parentElement];
            allInputsElements.forEach(el => {
                if(el) el.classList.remove('border-red-500', 'ring-2', 'ring-red-500', 'bg-red-50');
            });
            
            let isValid = true;
            let firstInvalidEl = null;

            const checkField = (el, condition) => {
                if (!condition && el) {
                    el.classList.add('border-red-500', 'ring-2', 'ring-red-500', 'bg-red-50');
                    isValid = false;
                    if (!firstInvalidEl) firstInvalidEl = el;
                }
            };

        const emailVal = emailInput.value.trim().toLowerCase();
        const contactValBase = contactInput.value.trim();
        const fullContactVal = "09" + contactValBase;

        const isEmailValid = emailVal !== '' && emailVal.endsWith('@gmail.com');
        const isContactValid = contactValBase !== '' && contactValBase.length === 9;

        if (emailVal !== '' && !isEmailValid) {
            emailInput.setCustomValidity("Please enter a valid @gmail.com address.");
            emailInput.reportValidity();
        } else {
            emailInput.setCustomValidity("");
        }

        if (contactValBase !== '' && !isContactValid) {
            contactInput.setCustomValidity("Please enter the remaining 9 digits of your contact number.");
            contactInput.reportValidity();
        } else {
            contactInput.setCustomValidity("");
        }

        checkField(nameInput, nameInput.value.trim() !== '');
        checkField(emailInput, isEmailValid);
        checkField(eventTypeInput, eventTypeInput.value.trim() !== '');
        checkField(contactInput, isContactValid);
        checkField(calendarGrid.parentElement, selectedDates.length > 0);
        const isTimeValid = (t) => t && t >= "06:00" && t <= "17:00";
        const startOk = isTimeValid(startTimeInput.value);
        const endOk = isTimeValid(endTimeInput.value);

        if (startTimeInput.value && !startOk) {
            startTimeInput.setCustomValidity("Start Time must be between 06:00 AM and 05:00 PM.");
            startTimeInput.reportValidity();
        } else {
            startTimeInput.setCustomValidity("");
        }

        if (endTimeInput.value && !endOk) {
            endTimeInput.setCustomValidity("End Time must be between 06:00 AM and 05:00 PM.");
            endTimeInput.reportValidity();
        } else {
            endTimeInput.setCustomValidity("");
        }

        checkField(startTimeInput, startOk);
        checkField(endTimeInput, endOk);

        if (!isValid) {
            if (firstInvalidEl) firstInvalidEl.scrollIntoView({ behavior: 'smooth', block: 'center' });
            return;
        }

            const calc = calculateTotal();
            const regFee = document.querySelector('input[name="regFee"]:checked').value;
            const equipList = [];
            
            const allRows = getAllRows();
            allRows.forEach(row => {
                const cb = row.querySelector('.equipment-checkbox');
                const qtyInput = row.querySelector('.equipment-quantity');
                if (cb && cb.checked) {
                    const price = parseFloat(row.dataset.price);
                    const qty = parseInt(qtyInput.value);
                    const days = calc.totalDays || 1;
                    const sub = row.dataset.unit.includes('hour') ? price * qty * (Math.ceil(calc.hours)||1) * days : price * qty * days;
                    
                    equipList.push({ 
                        id: row.dataset.id, 
                        name: row.dataset.name, 
                        unit: row.dataset.unit, 
                        qty: qty, 
                        price: price, 
                        subtotal: sub 
                    });
                }
            });

            const existingData = JSON.parse(localStorage.getItem('pgsoReservationData') || '{}');
            const data = {
                ...(existingData.id ? { id: existingData.id } : {}),
                contact: { fullName: nameInput.value, contactNumber: fullContactVal, email: emailVal },
                event: { 
                    venue: VENUE_NAME, 
                    eventType: eventTypeInput.value, 
                    registrationFee: regFee, 
                    dates: selectedDates.sort().join(', '), 
                    startTime: startTimeInput.value, 
                    endTime: endTimeInput.value, 
                    durationLabel: calc.durationLabel, 
                    totalHours: Math.ceil(calc.hours) 
                },
                equipment: equipList,
                pricing: { venueTotal: calc.venueTotal, equipmentTotal: calc.equipTotal, securityDeposit: SECURITY_DEPOSIT, grandTotal: calc.total },
                notes: notesInput.value
            };

            localStorage.setItem('pgsoReservationData', JSON.stringify(data));
            window.location.href = '../summary/summary.html';
        });

        // --- RESTORE SAVED DATA ---
        function loadSavedData() {
            const savedJSON = localStorage.getItem('pgsoReservationData');
            if (!savedJSON) return;
            const data = JSON.parse(savedJSON);
            if (data.event.venue !== VENUE_NAME) return; 

            const clean = (val) => (val === "N/A" ? "" : val);

            if (data.contact) {
                nameInput.value = clean(data.contact.fullName);
                contactInput.value = clean(data.contact.contactNumber);
                emailInput.value = clean(data.contact.email);
            }
            if (data.event) {
                eventTypeInput.value = clean(data.event.eventType);
                startTimeInput.value = data.event.startTime || "";
                endTimeInput.value = data.event.endTime || "";
                if (data.event.durationLabel) {
                    if (data.event.durationLabel.includes('4')) document.getElementById('duration-4').checked = true;
                    else document.getElementById('duration-8').checked = true;
                }
                if (data.event.registrationFee) {
                    const regRadio = document.querySelector(`input[name="regFee"][value="${data.event.registrationFee}"]`);
                    if(regRadio) regRadio.checked = true;
                }
                if (data.event.dates && data.event.dates.length > 0) {
                    selectedDates = data.event.dates.split(', ');
                }
            }
            if (data.notes) notesInput.value = clean(data.notes);

            if (data.equipment && data.equipment.length > 0) {
                const allRows = getAllRows();
                allRows.forEach(row => {
                    const rowId = row.dataset.id;
                    const rowName = row.dataset.name;
                    const savedItem = data.equipment.find(item => item.id === rowId || item.name === rowName);
                    
                    if (savedItem) {
                        const checkbox = row.querySelector('.equipment-checkbox');
                        const qtyInput = row.querySelector('.equipment-quantity');
                        const qtyBtns = row.querySelectorAll('.qty-btn');
                        if (checkbox && qtyInput) {
                            checkbox.checked = true;
                            qtyInput.disabled = false;
                            if (qtyBtns) qtyBtns.forEach(btn => btn.disabled = false);
                            qtyInput.value = savedItem.qty;
                        }
                    }
                });
            }
        }

        // --- INIT ---
        await loadInventory(); 
        await fetchBlockedDates(); 
        loadSavedData(); 
        updateInventoryLimits(); 
        calculateTotal(); 

        // Auto-fill and lock email if logged in
        const { data: authData } = await supabase.auth.getSession();
        if (authData && authData.session && authData.session.user) {
            const currentUserEmail = authData.session.user.email;
            if (emailInput.value && emailInput.value.toLowerCase() !== currentUserEmail.toLowerCase()) {
                nameInput.value = "";
                contactInput.value = "";
                emailInput.value = currentUserEmail;
                localStorage.removeItem('pgsoReservationData');
            } else if (!emailInput.value) {
                emailInput.value = currentUserEmail;
            }
            emailInput.readOnly = true;
            emailInput.classList.add('bg-gray-100', 'cursor-not-allowed', 'text-gray-500');
        }
    });