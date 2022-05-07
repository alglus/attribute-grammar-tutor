/* Constants */
export const ERROR = -1;


/* Strings */
export function textIsEmpty(text) {
    return (text.trim() === '');

}

export function splitIntoRows(text) {
    return text.split('\n');

}

export function splitIntoWords(text) {
    return text.trim().split(' ');

}

export function replaceMultipleWhiteSpacesByOne(text) {
    return text.replace(/[ \t]+/g, ' ')
}

export function removeAllWhiteSpaces(text) {
    return text.replace(/\s+/g, '');
}

export function containsAny(string, substringsArray) {
    return substringsArray.some(substr => string.includes(substr));

}


/* Arrays */
export function getLastArrayIndex(array) {
    return array.length - 1
}

export function getLastArrayItem(array) {
    return array[getLastArrayIndex(array)];
}

export function getPenultimateArrayItem(array) {
    return array[getLastArrayIndex(array) - 1];
}

export function emptyArray(array) {
    array.length = 0;
}

export function isInArray(array, value) {
    for (const item of array) {
        if (item === value) return true;
    }
    return false;
}

export function arrayIsEmpty(array) {
    return array.length === 0;
}

export function chooseOneAtRandom(array) {
    const randomIndex = getRandomInt(array.length);
    return array[randomIndex];
}

export function arrayHasDuplicateValues(array) {
    return array.length !== new Set(array).size;
}

export function getOrCreateArray(array) {
    return array || [];
}


/* Sets */
export function getLongestStringLengthInSet(set) {
    let longestStringLength = 0;
    set.forEach(string => {
        if (string.length > longestStringLength) {
            longestStringLength = string.length;
        }
    })
    return longestStringLength;
}

export function setIsEmpty(set) {
    return set.size === 0;
}


/* Maps */
export function mapKeysAreEqual(map1, map2) {

    if (map1.size !== map2.size)
        return false;

    for (const key1 of map1.keys()) {
        if (!map2.has(key1))
            return false;
    }
    return true;
}


/* Functions */
export function parameterHasBeenSpecified(parameter) {
    return typeof parameter !== 'undefined';
}


/* Misc */

// Returns a random number between 0 (inclusive) and max (exclusive).
function getRandomInt(max) {
    return Math.floor(Math.random() * max);
}

export function cloneElementAndSetNewAttributeValue(elementToBeCloned, attributeNames, newAttributeValues) {
    const newElement = elementToBeCloned.clone();

    for (let i = 0; i < attributeNames.length; i++) {

        // Change the attribute value of the new element.
        newElement.attr(attributeNames[i], newAttributeValues[i]);

        // Change the attribute value for all children (which have it) of the new element.
        newElement.find(`[${attributeNames[i]}]`).each(function () {
            $(this).attr(attributeNames[i], newAttributeValues[i]);
        });
    }

    return newElement;
}

export function symbolIsRoot(symbolIndex) {
    return symbolIndex === 0;
}

export function scrollTo(jQuerySelector) {
    jQuerySelector.get(0).scrollIntoView({behavior: 'smooth'})
}


/* jQuery */
export function disable(jQuerySelector) {
    jQuerySelector.prop('disabled', true);
}

export function enable(jQuerySelector) {
    jQuerySelector.prop('disabled', false);
}


/* Map with indexes */
export class IndexedMap {
    length = 0;

    #keysArray = [];
    #map = new Map();

    add(key, value) {
        this.#map.set(key, value);
        this.#keysArray.push(key);
        this.length++;
    }

    has(key) {
        return this.#map.has(key);
    }

    get(key) {
        return this.#map.get(key);
    }

    getAt(index) {
        const key = this.#keysArray[index];
        return this.#map.get(key);
    }

    getKeyAt(index) {
        return this.#keysArray[index];
    }

    getIndexOf(key) {
        for (let i = 0; i < this.#keysArray.length; i++) {
            if (this.#keysArray[i] === key) return i;
        }

        // Should never happen.
        return ERROR;
    }

    mergeIfAbsent(otherMap) {
        otherMap.forEach((v, k) => {
            if (!this.#map.has(k)) {
                this.add(k, v);
            }
        });
    }

    // Sort in ascending order.
    sort() {
        this.#keysArray.sort();
        const sortedMap = new Map();
        this.#keysArray.forEach(key => {
            sortedMap.set(key, this.#map.get(key));
        })
        this.#map = sortedMap;
    }

    values() {
        return this.#map.values();
    }

    * [Symbol.iterator]() {
        yield* this.#map;
    }

    getMapClone() {
        return new Map(this.#map);
    }
}