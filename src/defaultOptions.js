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
   become that complicated.
 */

/* https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Object/assign
   Object.assign() should wrap primitives into the target object, starting with key "0"
   That does not appear to be happening here, so writing workaround to mimic that.
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

/* This function removes functions, null and undefined from an array, mainly to avoid some super
   hacker including functions that interact in unexpected ways with code farther down the line.

   This function returns: false if not passed an array
                          an empty array if passed an empty array
                          an array scrubbed of functions, null and undefined
*/
export function scrubArray(passedArray) {
  if (!Array.isArray(passedArray)) return false;
  if (passedArray.length === 0) return [];

  let arr = [];

  passedArray.forEach((elem) => {
    if (typeof elem === `string` || typeof elem === `boolean` || typeof elem === `number` || typeof elem === `symbol`) {
      arr.push(elem);
    }
    else if (Array.isArray(elem)) {
      arr.push(scrubArray(elem));
    }
    else if (Object.prototype.toString.call(elem) === `[object Object]`) {
      arr.push(scrubObject(elem));
    } // ignore everything else
  });

  return arr;
}

/* This function removes functions, null and undefined values from an object, mainly to
   avoid some super hacker including functions that interact in unexpected ways with code farther
   down the line. It also removes non-enumerable keys and constructor information.

   This function returns: false if passed ![object Object] || !null || !undefined
                          an empty object if passed an empty object
                          an object scrubbed of functions, null and undefined
   
 */
export function scrubObject(passedObject) {
  if (Object.prototype.toString.call(passedObject) !== `[object Object]`) return false;
  if (passedObject === null || passedObject === undefined) return false;

  // scrubbed/flattened object
  let obj = {};

  // Scrub all non-enumerable properties, but keep properties farther up the prototype chain.
  // Also, by assigning the properties over, this scrubs constructor information, as well as
  // makes all properties writeable and configurable.
  for (let key in passedObject) {
    obj[key] = passedObject[key];
  }

  Object.keys(obj).forEach((key) => {
    if (typeof obj[key] === `string` || typeof obj[key] === `boolean` || typeof obj[key] === `number` || typeof obj[key] === `symbol`) {
      return;
    }
    else if (Array.isArray(obj[key])) {
      obj[key] = scrubArray(obj[key]);
    }
    else if (Object.prototype.toString.call(obj[key]) === `[object Object]`) {
      obj[key] = scrubObject(obj[key]);
    }
    else {
      delete obj[key];
    }
  });

  return obj;
}
