import { supabase } from "../supabase-config.js";

document.addEventListener('DOMContentLoaded', async function () {
    // --- QUERY PARAMETER VENUE NAME ---
    const urlParams = new URLSearchParams(window.location.search);
    const targetVenueName = urlParams.get('venue');

    if (!targetVenueName) {
        alert("No venue specified. Redirecting back to facilities.");
        window.location.href = '../venues.html';
        return;
    }

    // --- STATE VARIABLES ---
    let venueDetails = null;
    let selectedDates = [];
    let blockedDates = [];
    let globalInventory = [];
    let currentDate = new Date();
    let today = new Date();

    // DOM ELEMENTS
    const nameInput = document.getElementById('contact-name');
    const contactInput = document.getElementById('contact-number');
    const emailInput = document.getElementById('contact-email');
    const eventTypeInput = document.getElementById('event-type');
    const startTimeInput = document.getElementById('start-time');
    const endTimeInput = document.getElementById('end-time');
    const notesInput = document.getElementById('notes');
    const durationContainer = document.getElementById('duration-options-container');
    const tableBody = document.getElementById('equipment-table-body');
    const calendarGrid = document.getElementById('calendar-grid');
    const currentMonthYear = document.getElementById('currentMonthYear');
    const prevMonthBtn = document.getElementById('prevMonth');
    const nextMonthBtn = document.getElementById('nextMonth');
    const form = document.getElementById('reservation-form');

    // Display fields
    const daysDisplay = document.getElementById('days-reserved-display');
    const basePriceDisplay = document.getElementById('base-price-display');
    const equipmentDisplay = document.getElementById('equipment-cost-display');
    const subtotalDisplay = document.getElementById('subtotal-display');
    const depositDisplay = document.getElementById('security-deposit-display');
    const totalDisplay = document.getElementById('estimated-total-display');

    // --- 1. FETCH VENUE DETAILS ---
    async function loadVenueDetails() {
        try {
            const { data, error } = await supabase
                .from('venues')
                .select('*')
                .eq('name', targetVenueName)
                .single();

            if (error || !data) {
                throw new Error("Venue not found in database.");
            }

            venueDetails = data;

            // Populate UI Elements
            document.getElementById('venue-name-heading').innerText = venueDetails.name;
            document.getElementById('venue-desc-paragraph').innerText = venueDetails.description || "No description available.";
            document.getElementById('venue-category-badge').innerText = venueDetails.category;
            depositDisplay.innerText = `₱${parseFloat(venueDetails.security_deposit || 3000).toLocaleString('en-US', { minimumFractionDigits: 2 })}`;
            
            if (venueDetails.has_registration_fee) {
                document.getElementById('registration-fee-container').classList.remove('hidden');
            }

            // Populate Duration Options
            buildDurationOptions();
            
            // Fetch dependencies
            await fetchBlockedDates();
            await loadInventory();
            loadSavedData();
        } catch (err) {
            console.error(err);
            alert("Could not load venue details. Returning to facilities.");
            window.location.href = '../venues.html';
        }
    }

    // --- 2. BUILD DURATION RADIOS (NOW INFORMATIONAL ONLY) ---
    function buildDurationOptions() {
        durationContainer.innerHTML = "";
        
        if (venueDetails.price_daily !== null && venueDetails.price_daily !== undefined) {
            // Daily pricing only
            durationContainer.innerHTML = `
                <div class="block">
                    <div class="flex items-center gap-3 p-4 border border-gray-200 rounded-xl bg-gray-50">
                        <div>
                            <span class="block text-sm font-bold text-slate-800 font-sans">Whole Day</span>
                            <span class="block text-xs text-slate-500">Flat rate of ₱${parseFloat(venueDetails.price_daily).toLocaleString()} per day</span>
                        </div>
                    </div>
                </div>
            `;
            // For daily pricing, default start and end times to whole day
            startTimeInput.value = "08:00";
            endTimeInput.value = "17:00";
        } else if (venueDetails.price_first_4_hours !== null && venueDetails.price_first_4_hours !== undefined) {
            // Hourly pricing option
            durationContainer.innerHTML = `
                <div class="block">
                    <div class="flex items-center gap-3 p-4 border border-gray-200 rounded-xl bg-gray-50">
                        <div>
                            <span class="block text-sm font-bold text-slate-800 font-sans">First 4 Hours</span>
                            <span class="block text-xs text-slate-500">Rate of ₱${parseFloat(venueDetails.price_first_4_hours).toLocaleString()}</span>
                        </div>
                    </div>
                </div>
                <div class="block">
                    <div class="flex items-center gap-3 p-4 border border-gray-200 rounded-xl bg-gray-50">
                        <div>
                            <span class="block text-sm font-bold text-slate-800 font-sans">8 Hours</span>
                            <span class="block text-xs text-slate-500">Rate of ₱${parseFloat(venueDetails.price_first_4_hours * 1.8).toLocaleString()}</span>
                        </div>
                    </div>
                </div>
            `;
            
            if (venueDetails.price_succeeding_hour) {
                 durationContainer.innerHTML += `
                    <div class="block sm:col-span-2">
                        <div class="flex items-center gap-3 p-4 border border-gray-200 rounded-xl bg-gray-50">
                            <div>
                                <span class="block text-sm font-bold text-slate-800 font-sans">Overtime (Succeeding Hour)</span>
                                <span class="block text-xs text-slate-500">Rate of ₱${parseFloat(venueDetails.price_succeeding_hour).toLocaleString()} per hour</span>
                            </div>
                        </div>
                    </div>
                 `;
            }
        }
        
        // --- LISTENERS ---
        startTimeInput.removeEventListener('change', calculateTotal);
        endTimeInput.removeEventListener('change', calculateTotal);
        startTimeInput.addEventListener('change', calculateTotal);
        endTimeInput.addEventListener('change', calculateTotal);
        
        document.querySelectorAll('input[name="regFee"]').forEach(r => {
            r.removeEventListener('change', calculateTotal);
            r.addEventListener('change', calculateTotal);
        });
    }

    // --- 3. FETCH BLOCKED DATES ---
    async function fetchBlockedDates() {
        try {
            const { data, error } = await supabase
                .from('reservations')
                .select('*')
                .or(`event->>venue.eq.${venueDetails.name},event->>venue.eq.All Venues`)
                .neq('status', 'declined');

            if (error) throw error;

            blockedDates = [];
            if (data) {
                data.forEach(res => {
                    if (res.event && res.event.dates) {
                        const datesArray = res.event.dates.split(', ').map(d => d.trim());
                        datesArray.forEach(date => {
                            if (!blockedDates.includes(date)) blockedDates.push(date);
                        });
                    }
                });
            }
            renderCalendar();
        } catch (err) {
            console.error("Error fetching blocked dates:", err);
        }
    }

    // --- 4. RENDER CALENDAR ---
    function renderCalendar() {
        calendarGrid.innerHTML = "";
        currentMonthYear.innerText = currentDate.toLocaleDateString('en-US', { month: 'long', year: 'numeric' });
        
        const year = currentDate.getFullYear();
        const month = currentDate.getMonth();
        const firstDay = new Date(year, month, 1).getDay();
        const daysInMonth = new Date(year, month + 1, 0).getDate();

        // Empty cells for padding
        for (let i = 0; i < firstDay; i++) {
            calendarGrid.appendChild(document.createElement('div'));
        }

        // Days
        for (let i = 1; i <= daysInMonth; i++) {
            const dayCell = document.createElement('div');
            dayCell.classList.add('cal-cell');
            dayCell.innerText = i;

            const cellDateStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(i).padStart(2, '0')}`;

            if (new Date(year, month, i).setHours(0, 0, 0, 0) < today.setHours(0, 0, 0, 0)) {
                dayCell.classList.add('cal-past');
            } else if (blockedDates.includes(cellDateStr)) {
                dayCell.classList.add('cal-reserved');
            } else {
                dayCell.classList.add('cal-available');
                if (selectedDates.includes(cellDateStr)) {
                    dayCell.classList.add('cal-selected');
                }

                dayCell.addEventListener('click', function () {
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

    // --- 5. LOAD INVENTORY ---
    async function loadInventory() {
        if (!tableBody) return;
        try {
            const { data, error } = await supabase.from('inventory').select('*');
            if (error) throw error;

            const activeInventory = (data || []).filter(item => 
                !item.is_archived && 
                (!item.venue || item.venue === 'All Venues' || item.venue === venueDetails.name)
            );

            globalInventory = [];
            tableBody.innerHTML = "";

            if (activeInventory.length === 0) {
                tableBody.innerHTML = "<tr><td colspan='5' class='text-center p-6 text-slate-400'>No equipment available.</td></tr>";
                return;
            }

            activeInventory.forEach(item => {
                globalInventory.push({ ...item });

                const row = document.createElement('tr');
                row.dataset.id = item.id;
                row.dataset.price = item.price;
                row.dataset.unit = item.unit;
                row.dataset.name = item.name;

                row.innerHTML = `
                    <td class="p-3"><input type="checkbox" class="equipment-checkbox w-4 h-4 rounded border-gray-300"></td>
                    <td class="py-3 font-semibold text-slate-900 equipment-name">${item.name}</td>
                    <td class="py-3 text-slate-500">${item.unit}</td>
                    <td class="py-3 font-bold">₱${item.price}</td>
                    <td class="py-3 text-center">
                        <div class="flex items-center justify-center space-x-2">
                            <button type="button" class="qty-btn qty-minus w-6 h-6 rounded bg-gray-100 text-gray-600 hover:bg-gray-200 flex items-center justify-center font-bold" disabled><i class="fa-solid fa-minus text-[10px]"></i></button>
                            <input type="number" min="0" value="0" class="equipment-quantity w-10 text-center border border-gray-200 rounded p-0.5 hide-arrows" disabled>
                            <button type="button" class="qty-btn qty-plus w-6 h-6 rounded bg-gray-100 text-gray-600 hover:bg-gray-200 flex items-center justify-center font-bold" disabled><i class="fa-solid fa-plus text-[10px]"></i></button>
                        </div>
                    </td>
                `;
                tableBody.appendChild(row);
            });

            // Set up checkbox & qty adjustments event listeners
            tableBody.addEventListener('change', (e) => {
                if (e.target.classList.contains('equipment-checkbox')) {
                    const row = e.target.closest('tr');
                    const qtyInput = row.querySelector('.equipment-quantity');
                    const qtyBtns = row.querySelectorAll('.qty-btn');
                    qtyInput.disabled = !e.target.checked;
                    qtyBtns.forEach(btn => btn.disabled = !e.target.checked);
                    qtyInput.value = e.target.checked ? 1 : 0;
                    calculateTotal();
                }
            });

            tableBody.addEventListener('input', (e) => {
                if (e.target.classList.contains('equipment-quantity')) {
                    const input = e.target;
                    const max = parseInt(input.max) || Infinity;
                    const currentVal = parseInt(input.value) || 0;
                    if (currentVal > max) {
                        alert(`Only ${max} units available.`);
                        input.value = max;
                    }
                    calculateTotal();
                }
            });

            tableBody.addEventListener('click', (e) => {
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
                    calculateTotal();
                }
            });

        } catch (err) {
            console.error("Error loading inventory:", err);
        }
    }

    // --- 6. UPDATE INVENTORY LIMITS BASED ON SELECTED DATES ---
    async function updateInventoryLimits() {
        const rows = document.querySelectorAll('#equipment-table-body tr');
        if (rows.length === 0 || rows[0].querySelector('td').colSpan) return;

        // Reset
        rows.forEach(row => {
            const nameCell = row.querySelector('.equipment-name');
            const cleanName = row.dataset.name;
            nameCell.innerHTML = cleanName;
            row.classList.remove('bg-gray-50', 'opacity-60');
            const cb = row.querySelector('.equipment-checkbox');
            const qtyInput = row.querySelector('.equipment-quantity');
            const qtyBtns = row.querySelectorAll('.qty-btn');

            if (!cb.checked) {
                cb.disabled = false;
                qtyInput.disabled = true;
                qtyInput.value = 0;
                qtyBtns.forEach(btn => btn.disabled = true);
            }
        });

        if (selectedDates.length === 0) return;

        try {
            // Find active reservations overlapping with selected dates
            const { data } = await supabase.from('reservations').select('*').neq('status', 'declined');
            const usageMap = {};

            if (data) {
                data.forEach(res => {
                    if (res.event && res.event.dates && res.equipment) {
                        const bookedDates = res.event.dates.split(', ').map(d => d.trim());
                        const overlaps = bookedDates.some(date => selectedDates.includes(date));
                        
                        if (overlaps) {
                            res.equipment.forEach(item => {
                                const key = item.id || item.name;
                                if (!usageMap[key]) usageMap[key] = 0;
                                usageMap[key] += parseInt(item.qty || 0);
                            });
                        }
                    }
                });
            }

            // Adjust available quantities
            rows.forEach(row => {
                const itemId = row.dataset.id;
                const itemName = row.dataset.name;
                const dbItem = globalInventory.find(i => i.id === itemId);
                if (!dbItem) return;

                const maxStock = parseInt(dbItem.qty || 0);
                const usedStock = (usageMap[itemId] || 0) + (usageMap[itemName] || 0);
                const available = Math.max(0, maxStock - usedStock);

                const qtyInput = row.querySelector('.equipment-quantity');
                const cb = row.querySelector('.equipment-checkbox');
                const nameCell = row.querySelector('.equipment-name');
                const qtyBtns = row.querySelectorAll('.qty-btn');

                qtyInput.max = available;

                if (available <= 0) {
                    cb.checked = false;
                    cb.disabled = true;
                    qtyInput.disabled = true;
                    qtyInput.value = 0;
                    qtyBtns.forEach(btn => btn.disabled = true);
                    nameCell.innerHTML = `${itemName} <span class="text-red-500 text-[10px] font-bold uppercase">(Out of stock)</span>`;
                    row.classList.add('bg-gray-50', 'opacity-60');
                } else {
                    nameCell.innerHTML = `${itemName} <span class="text-green-600 text-[10px] font-semibold">(${available} available)</span>`;
                    if (parseInt(qtyInput.value) > available) qtyInput.value = available;
                }
            });

        } catch (err) {
            console.error("Error updating inventory limits:", err);
        }
        calculateTotal();
    }



    // --- 8. CALCULATE TOTAL COST ---
    function calculateTotal() {
        const totalDays = selectedDates.length || 0;
        let basePrice = 0;
        let baseDuration = 0;
        let durationLabel = "";
        let hoursDuration = 0;
        let overtimeCost = 0;

        let exactHours = 0;
        if (startTimeInput.value && endTimeInput.value) {
            const start = new Date(`1970-01-01T${startTimeInput.value}Z`);
            const end = new Date(`1970-01-01T${endTimeInput.value}Z`);
            let diffMs = end - start;
            if (diffMs < 0) diffMs += 24 * 60 * 60 * 1000;
            exactHours = diffMs / (1000 * 60 * 60);
        }

        if (venueDetails.price_daily !== null && venueDetails.price_daily !== undefined) {
            basePrice = parseFloat(venueDetails.price_daily);
            baseDuration = 24;
            hoursDuration = 24;
            durationLabel = "Whole Day";
        } else {
            hoursDuration = exactHours > 0 ? exactHours : 0;

            if (exactHours > 0) {
                if (exactHours < 8) {
                    basePrice = parseFloat(venueDetails.price_first_4_hours);
                    baseDuration = 4;
                    durationLabel = "First 4 Hours";
                    
                    if (exactHours > 4 && venueDetails.price_succeeding_hour) {
                        const overTimeRate = parseFloat(venueDetails.price_succeeding_hour);
                        overtimeCost = Math.ceil(exactHours - 4) * overTimeRate;
                    }
                } else {
                    basePrice = parseFloat(venueDetails.price_first_4_hours * 1.8);
                    baseDuration = 8;
                    durationLabel = "8 Hours";
                    
                    if (exactHours > 8 && venueDetails.price_succeeding_hour) {
                        const overTimeRate = parseFloat(venueDetails.price_succeeding_hour);
                        overtimeCost = Math.ceil(exactHours - 8) * overTimeRate;
                    }
                }
            } else {
                basePrice = 0;
                baseDuration = 0;
                durationLabel = "Time Not Set";
            }
        }

        const totalVenueCost = (basePrice + overtimeCost) * (totalDays || 1);
        let totalEquipmentCost = 0;

        let surcharge = 0;
        if (venueDetails && venueDetails.has_registration_fee) {
            const regFeeRadio = document.querySelector('input[name="regFee"]:checked');
            if (regFeeRadio && regFeeRadio.value === 'with-fee') {
                surcharge = totalVenueCost * 0.10;
            }
        }

        const rows = document.querySelectorAll('#equipment-table-body tr');
        rows.forEach(row => {
            const cb = row.querySelector('.equipment-checkbox');
            const qtyInput = row.querySelector('.equipment-quantity');
            
            if (cb && cb.checked) {
                const price = parseFloat(row.dataset.price);
                const qty = parseInt(qtyInput.value) || 0;
                const days = totalDays || 1;
                
                if (row.dataset.unit.includes('hour')) {
                    const billingHours = Math.ceil(hoursDuration) > 0 ? Math.ceil(hoursDuration) : 1;
                    totalEquipmentCost += price * qty * billingHours * days;
                } else {
                    totalEquipmentCost += price * qty * days;
                }
            }
        });

        const finalVenueCost = totalVenueCost + surcharge;
        const displayVenue = totalDays === 0 ? 0 : finalVenueCost;
        const subTotal = displayVenue + totalEquipmentCost;
        const securityDeposit = parseFloat(venueDetails.security_deposit || 3000);
        const grandTotal = subTotal + securityDeposit;

        daysDisplay.textContent = `${totalDays} day(s)`;

        if (overtimeCost > 0 || surcharge > 0) {
            let detailsHtml = "";
            if (surcharge > 0) detailsHtml += `<span class="text-orange-500 text-[10px] block mt-0.5">(+₱${surcharge.toLocaleString()} Reg Fee Surcharge)</span>`;
            if (overtimeCost > 0) detailsHtml += `<span class="text-red-500 text-[10px] block mt-0.5">(+₱${(overtimeCost * (totalDays || 1)).toLocaleString()} Overtime)</span>`;
            
            basePriceDisplay.innerHTML = `₱${displayVenue.toLocaleString()} ${detailsHtml}`;
        } else {
            basePriceDisplay.textContent = `₱${displayVenue.toLocaleString('en-US', { minimumFractionDigits: 2 })}`;
        }

        equipmentDisplay.textContent = `₱${totalEquipmentCost.toLocaleString('en-US', { minimumFractionDigits: 2 })}`;
        subtotalDisplay.textContent = `₱${subTotal.toLocaleString('en-US', { minimumFractionDigits: 2 })}`;
        totalDisplay.textContent = `₱${grandTotal.toLocaleString('en-US', { minimumFractionDigits: 2 })}`;

        return { totalVenueCost: finalVenueCost, totalEquipmentCost, grandTotal, hoursDuration, durationLabel, totalDays, securityDeposit, surcharge };
    }

    // --- 9. SUBMIT EVENT HANDLER ---
    form.addEventListener('submit', function (e) {
        e.preventDefault();

        if (selectedDates.length === 0) {
            alert("Please select at least one reservation date on the calendar.");
            return;
        }

        // Check start and end times bounds
        const isTimeValid = (t) => t && t >= "06:00" && t <= "22:00";
        if (!isTimeValid(startTimeInput.value) || !isTimeValid(endTimeInput.value)) {
            alert("Selected reservation times must be between 06:00 AM and 10:00 PM.");
            return;
        }

        const calc = calculateTotal();
        const regFee = document.querySelector('input[name="regFee"]:checked').value;
        const equipmentList = [];

        const rows = document.querySelectorAll('#equipment-table-body tr');
        rows.forEach(row => {
            const cb = row.querySelector('.equipment-checkbox');
            const qtyInput = row.querySelector('.equipment-quantity');
            
            if (cb && cb.checked) {
                const price = parseFloat(row.dataset.price);
                const qty = parseInt(qtyInput.value) || 0;
                const days = calc.totalDays || 1;
                let sub = row.dataset.unit.includes('hour') ? price * qty * (Math.ceil(calc.hoursDuration) || 1) * days : price * qty * days;
                
                equipmentList.push({
                    id: row.dataset.id,
                    name: row.dataset.name,
                    unit: row.dataset.unit,
                    qty: qty,
                    price: price,
                    subtotal: sub
                });
            }
        });

        const contactNoBase = contactInput.value.trim();
        const fullContactNo = "09" + contactNoBase;

        const reservationData = {
            contact: {
                fullName: nameInput.value.trim(),
                contactNumber: fullContactNo,
                email: emailInput.value.trim().toLowerCase()
            },
            event: {
                venue: venueDetails.name,
                eventType: eventTypeInput.value.trim(),
                registrationFee: regFee,
                dates: selectedDates.sort().join(', '),
                startTime: startTimeInput.value,
                endTime: endTimeInput.value,
                durationLabel: calc.durationLabel,
                totalHours: Math.ceil(calc.hoursDuration)
            },
            equipment: equipmentList,
            pricing: {
                venueTotal: calc.totalVenueCost,
                equipmentTotal: calc.totalEquipmentCost,
                securityDeposit: calc.securityDeposit,
                grandTotal: calc.grandTotal,
                surcharge: calc.surcharge || 0
            },
            notes: notesInput.value.trim()
        };

        localStorage.setItem('pgsoReservationData', JSON.stringify(reservationData));
        window.location.href = '../summary/summary.html';
    });

    // --- 10. RESTORE LOCALSTORAGE DATA ---
    function loadSavedData() {
        const savedJSON = localStorage.getItem('pgsoReservationData');
        if (!savedJSON) return;

        const data = JSON.parse(savedJSON);
        if (data.event.venue !== venueDetails.name) return;

        const clean = (val) => (val === "N/A" ? "" : val);

        if (data.contact) {
            nameInput.value = clean(data.contact.fullName);
            if (data.contact.contactNumber && data.contact.contactNumber.startsWith('09')) {
                contactInput.value = data.contact.contactNumber.substring(2);
            }
            emailInput.value = clean(data.contact.email);
        }

        if (data.event) {
            eventTypeInput.value = clean(data.event.eventType);
            startTimeInput.value = data.event.startTime || "";
            endTimeInput.value = data.event.endTime || "";

            // Restore fee selection
            if (data.event.registrationFee) {
                const regRadio = document.querySelector(`input[name="regFee"][value="${data.event.registrationFee}"]`);
                if (regRadio) regRadio.checked = true;
            }

            // Restore dates
            if (data.event.dates) {
                selectedDates = data.event.dates.split(', ').map(d => d.trim());
                renderCalendar();
                updateInventoryLimits();
            }
        }

        if (data.notes) {
            notesInput.value = clean(data.notes);
        }

        // Note: Equipment restoration is ignored here to ensure users re-validate available stock
        calculateTotal();
    }

    // Initialize Page
    await loadVenueDetails();
});
