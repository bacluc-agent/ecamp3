/**
 * merges multiple listeners objects into a single one that is properly interpreted by Vue
 * valuable to merge listeners from multiple composables
 *
 * Example Input:
 * [
 *  {
 *    'click': clickCallback1,
 *    'mousedown': mousedownCallback1,
 *  },
 *  {
 *    'click': clickCallback2
 *  }
 * ]
 *
 * Example Output:
 * {
 *   'click':[
 *      clickCallback1,
 *      clickCallback2
 *   ],
 *   'mousedown': [
 *      mousedownCallback1
 *   ]
 * }
 */
export default function (listenersList) {
  const mergedListeners = {}
  const listenerCaller = {}

  listenersList.forEach((listeners) => {
    for (const callbackName in listeners) {
      if (mergedListeners[callbackName] === undefined) {
        mergedListeners[callbackName] = []
        listenerCaller[callbackName] = (...params) => {
          mergedListeners[callbackName].forEach((callback) => callback(...params))
        }
      }

      mergedListeners[callbackName].push(listeners[callbackName])
    }
  })

  return listenerCaller
}
