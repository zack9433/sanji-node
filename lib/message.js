var XRegExp = require('xregexp'),
    trimResource = require('./router').trimResource,
    parseParams = require('./router').parseParams,
    parseQuerystring = require('./router').parseQuerystring,
    MessageType = {
      RESPONSE: {
        must: ['id', 'code', 'method', 'resource', 'sign'],
        prohibit: ['tunnel']
      },
      REQUEST: {
        must: ['id', 'method', 'resource'],
        prohibit: ['code', 'sign', 'tunnel']
      },
      DIRECT: {
        must: ['id', 'method', 'resource', 'tunnel'],
        prohibit: ['code', 'sign']
      },
      EVENT: {
        must: ['code', 'method', 'resource'],
        prohibit: ['id', 'sign', 'tunnel']
      },
      HOOK: {
        must: ['id', 'method', 'resource', 'sign'],
        prohibit: ['code', 'tunnel']
      }
    },
    id = 0,
    getType,
    Message;

function getId() {
  return (function() {
    id = (id === 4294967295) ? 0 : id + 1;
    return id;
  })();
}

function isType(mtype, data) {
  for (var mustIdx in MessageType[mtype].must) {
    var must = MessageType[mtype].must[mustIdx];
    if (!data[must]) {
      return false;
    }
  }

  for (var prohibitIdx in MessageType[mtype].prohibit) {
    var prohibit = MessageType[mtype].prohibit[prohibitIdx];
    if (data[prohibit]) {
      return false;
    }
  }

  return true;
}

getType = function getType(data) {
  for (var mtype in MessageType) {
    if(isType(mtype, data)) {
      return mtype;
    }
  }

  return 'UNKNOWN';
};

Message = function Message(data, generatedId) {
  if (typeof data === 'string') {
    try {
      data = JSON.parse(data);
    } catch (e) {
      throw new Error('Invaild json string');
    }
  }

  for (var prop in data) {
    this[prop] = data[prop];
  }

  if (generatedId !== false) {
    this.id = getId();
  }

  this._type = getType(this);
};

Message.prototype.match = function(route) {
  var m = JSON.parse(JSON.stringify(this)),  //  deep copy message obj
      _resource,
      match;

  delete m._type;

  _resource = trimResource(this.resource);
  match = XRegExp.exec(_resource, route.resourceRegex);

  if (!match) {
    return match;
  }

  m.method = m.method.toLowerCase();
  m.param = parseParams(match);
  m.query = {};

  // generate query
  if (match.querystring) {
    m.query = parseQuerystring(match.querystring);
  }

  return m;
};

Message.prototype.getType = getType;
Message.prototype.isType = isType;

module.exports = Message;
