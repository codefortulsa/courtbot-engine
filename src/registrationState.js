const registrationState = Object.freeze({
    UNBOUND: 0,
    ASKED_PARTY: 1,
    ASKED_REMINDER: 2,
    REMINDING: 3,
    UNSUBSCRIBED: 4
});

export default registrationState;
