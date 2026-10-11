let doorOpen = false;
let windowOpen = false;
let motionDetected = false;
let doorSensorOnline = true;
let windowSensorOnline = true;
let motionSensorOnline = true;
let securityMode = "disarmed";
let alertCount = 0;
let alarmTriggered = false;


// CHANGE SECURITY MODE
function changeMode() {

    securityMode = document.getElementById("securityMode").value;

    updateDisplay();
    checkSecurity();
}


// SAVE EVENT
function saveEvent(sensor, event, level) {

    fetch("/event", {
        method: "POST",
        headers: {
            "Content-Type": "application/json"
        },
        body: JSON.stringify({
            sensor: sensor,
            event: event,
            level: level
        })
    });

    // Add event to Recent Activity immediately
    let activityList = document.getElementById("activityList");

    if (activityList) {

        let icon = level === "HIGH" ? "🔴" : "🟢";

        let activity = document.createElement("div");

        activity.className = "activity-item";

        activity.innerHTML = `
            <div class="activity-icon">${icon}</div>

            <div>
                <strong>${event}</strong>
                <p>${sensor} • ${level} priority</p>
            </div>

            <span class="activity-time">Now</span>
        `;

        activityList.prepend(activity);

        // Keep only latest 5 activities
        while (activityList.children.length > 5) {
            activityList.removeChild(activityList.lastElementChild);
        }
    }
}


// DOOR
function toggleDoor() {

    doorOpen = !doorOpen;

    if (doorOpen) {

        document.getElementById("doorStatus").innerText =
            "🔴 OPEN";

        document.getElementById("doorCard")
            .classList.add("sensor-alert");

        saveEvent(
            "Door",
            "Door opened",
            "HIGH"
        );

    } else {

        document.getElementById("doorStatus").innerText =
            "🟢 CLOSED";

        document.getElementById("doorCard")
            .classList.remove("sensor-alert");

        saveEvent(
            "Door",
            "Door closed",
            "NORMAL"
        );
    }

    checkSecurity();
}


// WINDOW
function toggleWindow() {

    windowOpen = !windowOpen;

    if (windowOpen) {

        document.getElementById("windowStatus").innerText =
            "🔴 OPEN";

        document.getElementById("windowCard")
            .classList.add("sensor-alert");

        saveEvent(
            "Window",
            "Window opened",
            "HIGH"
        );

    } else {

        document.getElementById("windowStatus").innerText =
            "🟢 CLOSED";

        document.getElementById("windowCard")
            .classList.remove("sensor-alert");

        saveEvent(
            "Window",
            "Window closed",
            "NORMAL"
        );
    }

    checkSecurity();
}


// MOTION
function detectMotion() {

    motionDetected = true;

    document.getElementById("motionStatus").innerText =
        "MOTION DETECTED";

    document.getElementById("motionCard")
        .classList.add("sensor-alert");

    saveEvent(
        "Motion Sensor",
        "Motion detected",
        "HIGH"
    );

    checkSecurity();

    setTimeout(function () {

        motionDetected = false;

        document.getElementById("motionStatus").innerText =
            "No Motion";

        document.getElementById("motionCard")
            .classList.remove("sensor-alert");

        checkSecurity();

    }, 5000);
}


// UPDATE MODE DISPLAY
function updateDisplay() {

    let status =
        document.getElementById("statusText");

    let description =
        document.getElementById("securityDescription");


    if (securityMode === "disarmed") {

        status.innerText =
            "🟢 System Disarmed";

        description.innerText =
            "Security monitoring is disabled. Your home is not actively protected.";

    }

    else if (securityMode === "armed") {

        status.innerText =
            "🔒 System Armed";

        description.innerText =
            "All sensors are actively monitoring your home.";

    }

    else if (securityMode === "night") {

        status.innerText =
            "🌙 Night Mode Active";

        description.innerText =
            "Your home is protected while you are sleeping.";

    }

    else if (securityMode === "away") {

        status.innerText =
            "🏃 Away Mode Active";

        description.innerText =
            "Your home is fully protected while you are away.";
    }
}


// SECURITY CHECK
function checkSecurity() {

    let notification =
        document.getElementById("securityNotification");

    let status =
        document.getElementById("statusText");

    let alarm =
        document.getElementById("alarmStatus");

    let sidebarStatus =
        document.getElementById("sidebarStatus");

    let protection =
        document.getElementById("protectionStatus");

    let indicator =
        document.getElementById("indicatorText");

    let alarmBox =
        document.getElementById("alarmBox");

    let alarmText =
        document.getElementById("alarmText");

    let danger =
        doorOpen ||
        windowOpen ||
        motionDetected;


    // DISARMED
    if (securityMode === "disarmed") {

        status.innerText =
            "🟢 System Disarmed";

        alarm.innerText =
            "Alarm is OFF";

        sidebarStatus.innerText =
            "🟢 Secure";

        protection.innerText =
            "OFF";

        indicator.innerText =
            "SECURE";

        alarmText.innerText =
            "INACTIVE";

        alarmBox.classList.remove(
            "alarm-active"
        );
        notification.classList.remove("show");

        // No active alert when system is disarmed
        document.getElementById(
            "alertCount"
        ).innerText = "0";

        alarmTriggered = false;

        return;
    }


    // INTRUSION DETECTED
    if (danger) {

        status.innerText =
            "🚨 INTRUSION DETECTED";

        alarm.innerText =
            "🚨 ALARM ACTIVE";

        sidebarStatus.innerText =
            "🔴 ALERT";

        protection.innerText =
            "ON";

        indicator.innerText =
            "ALERT";

        alarmText.innerText =
            "ACTIVE";

        alarmBox.classList.add(
            "alarm-active"
        );
        notification.classList.add("show");

notification.innerText =
    "🚨 Security Alert: Intrusion detected!";

        // Show current active alert
        document.getElementById(
            "alertCount"
        ).innerText = "1";


        // Count only a NEW intrusion
        if (!alarmTriggered) {

            alertCount++;

            alarmTriggered = true;
        }

    }


    // NO INTRUSION
    else {

        if (securityMode === "armed") {

            status.innerText =
                "🔒 System Armed";

        }

        else if (securityMode === "night") {

            status.innerText =
                "🌙 Night Mode Active";

        }

        else if (securityMode === "away") {

            status.innerText =
                "🏃 Away Mode Active";
        }


        alarm.innerText =
            "Alarm is OFF";

        sidebarStatus.innerText =
            "🟢 Secure";

        protection.innerText =
            "ON";

        indicator.innerText =
            "SECURE";

        alarmText.innerText =
            "INACTIVE";

        alarmBox.classList.remove(
            "alarm-active"
        );
        notification.classList.remove("show");

        // No current active alert
        document.getElementById(
            "alertCount"
        ).innerText = "0";


        // Ready for a new intrusion
        alarmTriggered = false;
    }


    document.getElementById(
        "lastCheck"
    ).innerText = "Just now";
}

function updateSystemHealth() {

    let onlineSensors = 0;

    if (doorSensorOnline) onlineSensors++;
    if (windowSensorOnline) onlineSensors++;
    if (motionSensorOnline) onlineSensors++;

    let health = Math.round((onlineSensors / 3) * 100);

    document.getElementById("systemHealth").innerText =
        health + "%";
}


function toggleDoorSensor() {

    doorSensorOnline = !doorSensorOnline;

    updateSystemHealth();
}


function toggleWindowSensor() {

    windowSensorOnline = !windowSensorOnline;

    updateSystemHealth();
}


function toggleMotionSensor() {

    motionSensorOnline = !motionSensorOnline;

    updateSystemHealth();
}


updateSystemHealth();
