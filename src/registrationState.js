const registrationState = {}

Object.defineProperties(registrationState, {
  'UNBOUND': {
    value: 0,
    enumerable: true,
    configurable: false,
    writable: false
  },
  'ASKED_PARTY': {
    value: 1,
    enumerable: true,
    configurable: false,
    writable: false
  },
  'ASKED_REMINDER': {
    value: 2,
    enumerable: true,
    configurable: false,
    writable: false
  },
  'REMINDING': {
    value: 3,
    enumerable: true,
    configurable: false,
    writable: false
  },
  'UNSUBSCRIBED': {
    value: 4,
    enumerable: true,
    configurable: false,
    writable: false
  }
});

export default registrationState;