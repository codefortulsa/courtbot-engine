import {scrubArray, scrubObject} from './utils';

/* This function returns an options object with at least a default dbURL property

   options: an value which contains additional options
   if options is an object, it assigns the key/value pairs to the returned object
   if options is an array, it assigns the values of the array to the string keys corresponding to
       array index (e.g. The item at array index 0 is assigned to key `0`)
   if options is a primitive value, it pushed the value into an array of length 1

   if more than one argument is passed, it parses the parameters as above. Arrays are concatenated,
   and key collisions for multiple objects are resolved by overwriting the existing value of the key.

   This function may change the values of arrays/objects passed as arguments. Deep copying before
   handling is not implemented. I'm hoping that options for a text message reminder system never
   becomes that complicated.
 */
export default function (...args) {
  let _optionArray = [];
  let _optionObject = {};
  
  // Parse arguments
  args.forEach((arg) => {
    // add primitives to array
    if (typeof arg === `string` || typeof arg === `boolean` || typeof arg === `number` || typeof arg === `symbol`) {
      _optionArray.push(arg)
    }
    // Add arrays
    else if (Array.isArray(arg)) {
      _optionArray = _optionArray.concat(scrubArray(arg));
    }
    // merge additional objects, overwriting existing keys
    else if (Object.prototype.toString.call(arg) === '[object Object]') {
      Object.assign(_optionObject, scrubObject(arg));
    }
    // ignore everything else
    // The other typeof responses: hostobject, functions and undefined, could cause problems
  });

  // merge _optionArray into _optionObject
  // if any of the keys in _optionObject are numbers that correspond to indices of _optionArray,
  // they will be overwritten
  Object.assign(_optionObject, _optionArray);  

  return Object.assign({
    path: "/courtbot", //deprecated
    dbUrl: process.env.DATABASE_URL || "postgres://postgres:postgres@localhost:5432/courtbotdb"
  }, _optionObject);
}
