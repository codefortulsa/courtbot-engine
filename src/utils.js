/* Various Utility Functions */

/* array: array to deep flatten, preserving order of elements
 *     All elements in sub-arrays are placed in the top level
 *     Arrays wrapped inside objects are not altered
 *     TO DO, POSSIBLY: Place this and other functions (scrubObject, scrubArray from defaultOptions.js) in utils.js
 */
export function deepFlattenArray(passedArray) {
  // For now, deciding against returning the passed parameter, even though that means
  // using the function properly requires an additional test upstream
  if (!Array.isArray(passedArray)) return false;

  let arr = [];

  passedArray.forEach((elem) => {
    if (Array.isArray(elem)) {
      deepFlattenArray(elem).forEach((e) => {
        arr.push(e);
      });
    }
    else {
      arr.push(elem);
    }
  });

  return arr;
}

/* This function removes functions, null and undefined from an array, mainly to avoid some super
 * hacker including functions that interact in unexpected ways with code farther down the line.
 *
 * This function returns: false if not passed an array
 *                        an empty array if passed an empty array
 *                        an array scrubbed of functions, null and undefined
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
 * avoid some super hacker including functions that interact in unexpected ways with code farther
 * down the line. It also removes non-enumerable keys and constructor information.
 *
 * This function returns: false if passed ![object Object] || !null || !undefined
 *                        an empty object if passed an empty object
 *                        an object scrubbed of functions, null and undefined 
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