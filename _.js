module.exports = {
    flatten: function(arr,separator) {
        separator = separator || '.'
        function dive(currentKey, into, target) {
            for (var i in into) {
                if (into.hasOwnProperty(i)) {
                    var newKey = i;
                    var newVal = into[i];
                    
                    if (currentKey.length > 0) {
                        newKey = currentKey + separator + i;
                    }
                    
                    if (typeof newVal === "object") {
                        console.dir(newVal)
                        dive(newKey, newVal, target);
                    } else {
                        target[newKey] = newVal;
                    }
                }
            }
        }
        var newObj = {};
        dive("", arr, newObj);
        return newObj;
    }
}
