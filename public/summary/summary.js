import { supabase } from "../supabase-config.js";

// Helpers
const formatCurrency = (amount) => '₱' + parseFloat(amount).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
const safeText = (text) => (text && text !== "") ? text : "N/A";

const formatReservationDates = (dateStr) => {
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
        const m = first.toLocaleDateString('en-US', { month: 'short' });
        const y = first.toLocaleDateString('en-US', { year: 'numeric' });
        
        if (grp.length === 1) {
            return `${m}. ${first.getDate()}, ${y}`;
        } else {
            const lastM = last.toLocaleDateString('en-US', { month: 'short' });
            const lastY = last.toLocaleDateString('en-US', { year: 'numeric' });
            if (y !== lastY) {
                return `${m}. ${first.getDate()}, ${y} - ${lastM}. ${last.getDate()}, ${lastY}`;
            } else if (m !== lastM) {
                return `${m}. ${first.getDate()} - ${lastM}. ${last.getDate()}, ${y}`;
            } else {
                return `${m}. ${first.getDate()}-${last.getDate()}, ${y}`;
            }
        }
    };
    return groups.map(formatGrp).join(', ');
};


window.returnHome = function () { window.location.href = '../venues.html'; }

// --- RULES POPUP LOGIC ---
window.openRules = function () {
    document.getElementById('rulesModal').classList.remove('hidden');
}

window.closeRules = function () {
    document.getElementById('rulesModal').classList.add('hidden');
}

// Enable/Disable Submit Button based on Checkbox
const agreeCheckbox = document.getElementById('agree-checkbox');
const finalSubmitBtn = document.getElementById('final-submit-btn');

agreeCheckbox.addEventListener('change', function () {
    if (this.checked) {
        finalSubmitBtn.disabled = false;
        finalSubmitBtn.classList.remove('opacity-50', 'cursor-not-allowed');
        finalSubmitBtn.classList.add('hover:bg-opacity-90');
    } else {
        finalSubmitBtn.disabled = true;
        finalSubmitBtn.classList.add('opacity-50', 'cursor-not-allowed');
        finalSubmitBtn.classList.remove('hover:bg-opacity-90');
    }
});

window.goBack = function () {
    const data = JSON.parse(localStorage.getItem('pgsoReservationData'));
    if (!data) return window.location.href = '../index.html';
    const venueName = data.event.venue;
    let backUrl = "../venues.html";
    if (venueName.includes("Palispis")) backUrl = "../palispis-reservation/palispis-reservation.html";
    else if (venueName.includes("PCL")) backUrl = "../pcl-reservation/pcl-reservation.html";
    else if (venueName.includes("Gymnasium")) backUrl = "../gym-reservation/gym-reservation.html";
    window.location.href = backUrl;
};

window.submitReservation = async function () {
    const data = JSON.parse(localStorage.getItem('pgsoReservationData'));
    if (!data) return alert("No data found.");

    const submitBtn = document.getElementById('final-submit-btn');
    const originalText = submitBtn.innerText;
    submitBtn.innerText = "Sending...";
    submitBtn.disabled = true;

    try {
        // Force binding to the currently logged in user to avoid "missing reservation" bug
        const { data: authData } = await supabase.auth.getSession();
        if (authData && authData.session && authData.session.user) {
            if (!data.contact) data.contact = {};
            data.contact.email = authData.session.user.email.toLowerCase();
        }

        // --- CONCURRENCY CHECK ---
        if (data.event && data.event.dates) {
            const { data: existingReservations, error: fetchError } = await supabase
                .from('reservations')
                .select('id, event, status')
                .eq('event->>venue', data.event.venue)
                .neq('status', 'declined');

            if (fetchError) throw fetchError;

            const proposedDates = data.event.dates.split(', ');
            let hasConflict = false;

            if (existingReservations && existingReservations.length > 0) {
                for (const res of existingReservations) {
                    if (data.id && res.id === data.id) continue;

                    if (res.event && res.event.dates) {
                        const existingDates = res.event.dates.split(', ');
                        const overlap = proposedDates.some(date => existingDates.includes(date));
                        if (overlap) {
                            hasConflict = true;
                            break;
                        }
                    }
                }
            }

            if (hasConflict) {
                alert("Sorry, one or more of your selected dates have just been reserved by someone else. Please go back and select different dates.");
                submitBtn.innerText = originalText;
                submitBtn.disabled = false;
                return;
            }
        }
        // --- END CONCURRENCY CHECK ---

        let error;
        if (data.id) {
            const updatePayload = {
                ...data,
                status: "pending",
                updatedAt: new Date().toISOString()
            };
            const response = await supabase.from('reservations').update(updatePayload).eq('id', data.id);
            error = response.error;
        } else {
            const insertPayload = {
                ...data,
                status: "pending",
                submittedAt: new Date().toISOString(),
                timestamp: new Date().toISOString()
            };
            const response = await supabase.from('reservations').insert([insertPayload]);
            error = response.error;
        }

        if (error) throw error;

        // Notify Admin
        try {
            await supabase.from('notifications').insert([{
                user_email: null,
                title: data.id ? 'Reservation Updated' : 'New Reservation',
                message: `${data.contact.fullName} has submitted a reservation request for ${data.event.venue}.`
            }]);
        } catch (e) {
            console.warn('Failed to dispatch notification', e);
        }

        document.getElementById('rulesModal').classList.add('hidden'); // Close rules
        document.getElementById('successModal').classList.remove('hidden'); // Show success
        localStorage.removeItem('pgsoReservationData');

    } catch (error) {
        console.error("Error adding document: ", error);
        alert("Error sending reservation: " + error.message);
        submitBtn.innerText = originalText;
        submitBtn.disabled = false;
    }
};

document.addEventListener('DOMContentLoaded', function () {
    const data = JSON.parse(localStorage.getItem('pgsoReservationData'));
    if (!data) {
        alert("No reservation data found. Redirecting to home.");
        window.location.href = '../venues.html';
        return;
    }

    document.getElementById('summary-name').textContent = safeText(data.contact.fullName);
    document.getElementById('summary-contact').textContent = safeText(data.contact.contactNumber);
    document.getElementById('summary-email').textContent = safeText(data.contact.email);
    document.getElementById('summary-venue').textContent = safeText(data.event.venue);
    document.getElementById('summary-event-type').textContent = safeText(data.event.eventType);
    document.getElementById('summary-date').textContent = formatReservationDates(data.event.dates);
    document.getElementById('summary-time').textContent = `${data.event.startTime} - ${data.event.endTime}`;
    document.getElementById('summary-duration').textContent = safeText(data.event.durationLabel);
    document.getElementById('summary-notes').textContent = safeText(data.notes);

    const equipTbody = document.getElementById('equipment-summary-tbody');
    if (data.equipment && data.equipment.length > 0) {
        equipTbody.innerHTML = "";
        data.equipment.forEach(item => {
            const row = document.createElement('tr');
            row.innerHTML = `
                    <td class="px-6 py-4 text-gray-700 font-medium">${item.name}</td>
                    <td class="px-6 py-4 text-center">${item.qty}</td>
                    <td class="px-6 py-4 text-gray-500">${item.unit}</td>
                    <td class="px-6 py-4 text-right">${formatCurrency(item.price)}</td>
                    <td class="px-6 py-4 text-right font-bold text-gray-900">${formatCurrency(item.subtotal)}</td>
                `;
            equipTbody.appendChild(row);
        });
    } else {
        document.getElementById('no-equipment-message').classList.remove('hidden');
    }

    document.getElementById('summary-base-rental').textContent = formatCurrency(data.pricing.venueTotal);
    document.getElementById('summary-equipment-cost').textContent = formatCurrency(data.pricing.equipmentTotal);
    document.getElementById('summary-total-amount').textContent = formatCurrency(data.pricing.grandTotal);

    const editLink = document.getElementById('edit-reservation-link');
    let backUrl = "../venues.html";
    if (data.event.venue.includes("Palispis")) backUrl = "../palispis-reservation/palispis-reservation.html";
    else if (data.event.venue.includes("PCL")) backUrl = "../pcl-reservation/pcl-reservation.html";
    else if (data.event.venue.includes("Gymnasium")) backUrl = "../gym-reservation/gym-reservation.html";
    editLink.href = backUrl;
});