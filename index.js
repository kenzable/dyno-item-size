var dynoItemSize = module.exports = function(record) {
  return Object.keys(record).reduce(function(s, k) {
    var v = record[k];

    // undefined variables will be removed from the payload when serialized
    if (typeof v === 'undefined') {
      return s;
    }
    // Attribute name:
    // number of UTF-8-encoded bytes
    s += new Buffer(k, 'utf8').length;
    s += sizeOfValue(v);

    return s;
  }, 0);
};

var sizeOfValue = module.exports.sizeOfValue = function(v) {
  var s = 0;
  // String value
  // Strings are Unicode with UTF-8 binary encoding. The size of a string is
  // (length of attribute name) + (number of UTF-8-encoded bytes)
  if (typeof v === 'string') {
    s += new Buffer(v, 'utf8').length;
  }
  // Number value
  // Numbers are variable length, with up to 38 significant digits.
  // Leading and trailing zeroes are trimmed. The size of a number is approximately
  // (length of attribute name) + (1 byte per two significant digits) + (1 byte).
  else if(typeof v === 'number') {
    // Convert to binary, remove leading zeros, remove decimal, remove trailing zeros
    var len = v.toString(2).replace(/^0\.0*|\.|0+$/g, '').length;
    len = len > 38 ? 38 : len;
    s += Math.ceil(len/2) + 1;
  }
  // Boolean value
  // The size of a null attribute or a Boolean attribute is (length of attribute name) + (1 byte)
  else if(typeof v === 'boolean' || v === null) {
    s += 1
  }
  // List or Map value
  // An attribute of type List or Map requires 3 bytes of overhead,
  // regardless of its contents. The size of a List or Map is
  // (length of attribute name) + sum (size of nested elements) + (3 bytes) .
  // The size of an empty List or Map is
  // (length of attribute name) + (3 bytes).
  else if (typeof v === 'object' && !(v instanceof Buffer)) {
    s += 3
    // List value
    // Calulates size of elements by
    if (Array.isArray(v)) {
      s += v.reduce(function(s, v) {
        return s + sizeOfValue(v);
      }, 0);
    }
    // Map value
    else {
      s += dynoItemSize(v);
    }
  }
  // unknown type
  else s += v.length;
  return s;
}

module.exports.read = function(record) {
  var size = dynoItemSize(record);
  return Math.ceil(size/1024/4);
};

module.exports.write = function(record) {
  var size = dynoItemSize(record);
  return Math.ceil(size/1024);
};

module.exports.storage = function(record) {
  var size = dynoItemSize(record);
  return size + 100;
};
