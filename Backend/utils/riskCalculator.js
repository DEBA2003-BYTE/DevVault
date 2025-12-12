// Calculate distance between two coordinates using Haversine formula
function calculateDistance(lat1, lon1, lat2, lon2) {
    const R = 6371; // Radius of Earth in kilometers
    const dLat = toRad(lat2 - lat1);
    const dLon = toRad(lon2 - lon1);

    const a = Math.sin(dLat / 2) * Math.sin(dLat / 2) +
        Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) *
        Math.sin(dLon / 2) * Math.sin(dLon / 2);

    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    const distance = R * c;

    return distance; // in kilometers
}

function toRad(degrees) {
    return degrees * (Math.PI / 180);
}

// Calculate location anomaly score (max 20)
function calculateLocationScore(registeredLat, registeredLon, currentLat, currentLon) {
    const distance = calculateDistance(registeredLat, registeredLon, currentLat, currentLon);

    // If within 1km, no risk
    if (distance <= 1) return 0;

    // Each km adds 5 points, max 20
    const score = Math.min(Math.floor(distance) * 5, 20);
    return score;
}

// Calculate keystroke anomaly score (max 30)
function calculateKeystrokeScore(deleteCount) {
    // Each deletion adds 1 point, max 30
    return Math.min(deleteCount, 30);
}

// Calculate session time score (max 30)
function calculateSessionTimeScore(sessionTimeSeconds) {
    // Every 3 seconds adds 1 point, max 30
    const score = Math.min(Math.floor(sessionTimeSeconds / 3), 30);
    return score;
}

// Calculate usual time score (max 20)
// Now calculates risk when OUTSIDE the usual time range
function calculateUnusualTimeScore(loginTime, usualTimeRanges) {
    if (!usualTimeRanges || usualTimeRanges.length === 0) {
        return 0;
    }

    // loginTime should be in HH:MM format (e.g., "17:30")
    const loginMinutes = timeToMinutes(loginTime);

    // Check all usual time ranges
    for (const range of usualTimeRanges) {
        const startMinutes = timeToMinutes(range.startTime);
        const endMinutes = timeToMinutes(range.endTime);

        let isInRange = false;

        if (startMinutes <= endMinutes) {
            // Normal range (e.g., "09:00" to "17:00")
            isInRange = loginMinutes >= startMinutes && loginMinutes < endMinutes;
        } else {
            // Range crosses midnight (e.g., "22:00" to "06:00")
            isInRange = loginMinutes >= startMinutes || loginMinutes < endMinutes;
        }

        // If login is INSIDE usual range, no risk
        if (isInRange) {
            return 0;
        }
    }

    // Login is OUTSIDE all usual ranges - calculate risk based on distance
    let minDistance = Infinity;

    for (const range of usualTimeRanges) {
        const startMinutes = timeToMinutes(range.startTime);
        const endMinutes = timeToMinutes(range.endTime);

        let distanceFromStart, distanceFromEnd;

        if (startMinutes <= endMinutes) {
            // Normal range
            distanceFromStart = Math.abs(loginMinutes - startMinutes);
            distanceFromEnd = Math.abs(loginMinutes - endMinutes);
        } else {
            // Range crosses midnight
            if (loginMinutes >= startMinutes) {
                // Login is after start (e.g., login at 23:00, range starts at 22:00)
                distanceFromStart = Math.abs(loginMinutes - startMinutes);
                distanceFromEnd = Math.min(
                    Math.abs(loginMinutes - endMinutes),
                    (1440 - loginMinutes) + endMinutes
                );
            } else {
                // Login is before end (e.g., login at 08:00, range ends at 06:00)
                distanceFromStart = Math.min(
                    Math.abs(loginMinutes - startMinutes),
                    loginMinutes + (1440 - startMinutes)
                );
                distanceFromEnd = Math.abs(loginMinutes - endMinutes);
            }
        }

        // Take the AVERAGE distance from both boundaries
        const avgDistanceFromRange = (distanceFromStart + distanceFromEnd) / 2;

        // Keep track of minimum distance across all ranges
        minDistance = Math.min(minDistance, avgDistanceFromRange);
    }

    // Convert minutes to hours for scoring
    const hoursDiff = Math.floor(minDistance / 60);

    // Each hour adds 3 points, max 20
    return Math.min(hoursDiff * 3, 20);
}

// Helper function to convert HH:MM to total minutes since midnight
function timeToMinutes(timeString) {
    const [hours, minutes] = timeString.split(':').map(Number);
    return hours * 60 + minutes;
}

// Calculate total risk score
function calculateTotalRiskScore(locationScore, keystrokeScore, sessionTimeScore, unusualTimeScore) {
    return locationScore + keystrokeScore + sessionTimeScore + unusualTimeScore;
}

// Determine action based on risk score
function determineAction(riskScore) {
    if (riskScore >= 0 && riskScore <= 40) {
        return 'access_granted';
    } else if (riskScore >= 41 && riskScore <= 70) {
        return 'mfa_required';
    } else {
        return 'blocked';
    }
}

module.exports = {
    calculateLocationScore,
    calculateKeystrokeScore,
    calculateSessionTimeScore,
    calculateUnusualTimeScore,
    calculateTotalRiskScore,
    determineAction,
    calculateDistance
};
