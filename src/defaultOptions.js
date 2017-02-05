/* This function returns an options object with at least a default dbURL property

   options: an value which contains additional options
   if options is an object, it assigns the key/value pairs to the returned object
   if options is an array, it assigns the values of the array to the string keys corresponding to array index
       (e.g. The item at array index 0 is assigned to key `0`)
   if options is a primitive value, it converts the value to an array of length 1, then continues

   if more than one argument is passed, it parses the parameters as above. Arrays are concatenated, and key
   collisions for multiple objects are resolved by overwriting the existing value of the key.

   WARNING: THIS FUNCTION DOES NOT DEEP COPY OBJECTS/ARRAYS
   WARNING: THIS FUNCTION REMOVES NESTED ARRAYS AND OBJECTS FROM PARAMETERS
*/

/* https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Object/assign
   Object.assign() should wrap primitives into the target object, starting with key "0"
   Does not appear to be happening here, so writing workaround */
export default function (...args) {
  let _optionArray = [];
  let _optionObject = {};
  
  // Parse arguments
  args.forEach((arg) => {
    // convert primitives
    if (typeof arg === `string` || typeof arg === `boolean` || typeof arg === `number`) {
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
    // treat Symbols and other types as empty objects
    // The other typeof responses: hostobject, functions and undefined, could cause problems
    else {
    }
  });

  // merge _optionArray into _optionObject
  Object.assign(_optionObject, _optionArray);  

  return Object.assign({
    path: "/courtbot", //deprecated
    dbUrl: process.env.DATABASE_URL || "postgres://postgres:postgres@localhost:5432/courtbotdb"
  }, _optionObject);
}

/* This function removes symbols and functions from an array, mainly to avoid some super hacker
   pushing functions that interact in unexpected ways with code farther down the line.

   This function returns: false if not passed an array
                          the array itself if passed an empty array
                          an array scrubbed of symbols, functions, null and undefined
*/
export function scrubArray(passedArray) {
  if (!Array.isArray(passedArray)) return false;

  // avoid changing passed array
  let arr = passedArray;
  if (arr.length === 0) return arr;

  let i = 0;
  while (i < arr.length) {
    if (typeof arr[i] === `string` || typeof arr[i] === `boolean` || typeof arr[i] === `number`) {
      i++;
    }
    else if (Array.isArray(arr[i])) {
      arr[i] = scrubArray(arr[i]);
      i++;
    }
    else if (Object.prototype.toString.call(arr[i]) === `[object Object]`) {
      arr[i] = scrubObject(arr[i]);
      i++;
    }
    else {
      arr.splice(i, 1);
    }
  }

  return arr;
}

/* This function removes symbols and functions from the enumerable keys of an object, mainly to
   avoid some super hacker pushing functions that interact in unexpected ways with code farther
   down the line.

   This function returns: false if not passed an [object Object] && !null && !undefined
                          an empty object if passed an empty object
                          an object scrubbed of symbols, functions, null and undefined
   
    */
export function scrubObject(passedObject) {
  if (Object.prototype.toString.call(passedObject) !== `[object Object]`) return false;
  if (passedObject === null || passedObject === undefined) return false;

  // avoid changing passed object while we alter it
  let obj = {};

  // Scrub all non-enumerable properties, but keep properties farther up the prototype chain.
  // Also, by assigning the properties over, this scrubs constructor information as well as
  // makes all property writeable and configurable.
  for (let key in passedObject) {
    obj[key] = passedObject[key];
  }

  Object.keys(obj).forEach((key) => {
    if (typeof obj[key] === `string` || typeof obj[key] === `boolean` || typeof obj[key] === `number`) {
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