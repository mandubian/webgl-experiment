(function(){
  CUBE_SIZE = 0.6;
  CHUNK_SIZE = 32;

  VIEW_DISTANCE_X = 20;

  VIEW_DISTANCE_Y = 20;

  VIEW_DISTANCE_Z = 20;

  ChunkArray = Uint8Array;

  CHUNK = function() { return Cube({ "drawMode" : "TRIANGLES"}); }

  CHUNK_TYPE = {
    "air" : 0,
    "grass" : 1
  };

  this.World = function(options){
    requireOptions(options, [ "engine", "texture" ]);

    if ( !(this instanceof arguments.callee) ) return new arguments.callee(options);

    this.texture = options.texture;
    this.engine = options.engine;

    this.chunks = {};
    this.cachedVBOs = {};
    this.dirtyVBOs = {};
    this.chunkSize = CHUNK_SIZE;
  }

  World.prototype = {
    generateUltraSimple: function() {
      var x, y, z;
      this.texture.create();
      for(x=0; x<20; x+=2)
        for(y=0; y<20; y+=2)
          for(z=0; z<20; z+=2)
            this.setBlock(x, y, z, "grass");

      return this;
    },

    markVBODirty: function(x, y, z) {
      var key = "" + x + "|" + y + "|" + z;

      if(this.cachedVBOs[key]) this.dirtyVBOs[key] = true;
    },

    getBlock: function(x, y, z) {
      var key = "" + x + "|" + y + "|" + z,
          chunkSize = this.chunkSize,
          chunk, cx, cy, cz;

      cx = x / chunkSize;
      cy = y / chunkSize;
      cz = z / chunkSize;
      chunk = this.getChunk(cx, cy, cz);

      if(!chunk) return null;

      inX = x % chunkSize;
      inY = y % chunkSize;
      inZ = z % chunkSize;

      return chunk[inX + inY * chunkSize + inZ * chunkSize * chunkSize];
    },

    setBlock: function(x, y, z, type) {
      var key = "" + x + "|" + y + "|" + z,
          chunkSize = this.chunkSize,
          chunk, cx, cy, cz, oldType, inX, inY, inZ;
      
      cx = Math.floor(x / chunkSize);
      cy = Math.floor(y / chunkSize);
      cz = Math.floor(z / chunkSize);

      chunk = this.getOrCreateChunk(cx, cy, cz);

      inX = x % chunkSize;
      inY = y % chunkSize;
      inZ = z % chunkSize;

      chunk[inX + inY * chunkSize + inZ * chunkSize * chunkSize] = CHUNK_TYPE[type];

      this.markVBODirty(cx, cy, cz);
    },

    getOrCreateChunk: function(x, y, z){
      var key = "" + x + "|" + y + "|" + z;
      var chunk = this.chunks[key];

      if(!chunk) chunk = this.chunks[key] = new ChunkArray(this.chunkSize * this.chunkSize * this.chunkSize);

      return chunk;
    },

    getChunk: function(x, y, z) {
      var key = "" + x + "|" + y + "|" + z;
      return this.chunks[key];
    },

    setChunk: function(x, y, z, chunk) {
      var key = "" + x + "|" + y + "|" + z;
      this.chunks[key] = chunk;
      this.dirtyVBOs[key] = true;
    },

    getChunkVBO: function(x, y, z) {
      var key = "" + x + "|" + y + "|" + z,
          chunk = this.chunks[key], 
          vbo;

      if(!chunk) return null;
      vbo = this.cachedVBOs[key];
      if(!vbo || this.dirtyVBOs[key]) {
        if(vbo) vbo.destroy();
        vbo = this.updateVBO(x, y, z);
        delete this.dirtyVBOs[key];
        this.cachedVBOs[key] = vbo;
      }

      return vbo;
    },

    updateVBO: function(x, y, z) {
      var chunk, type,
          chunkSize = this.chunkSize,
          cx, cy, cz,
          offX = x * chunkSize,
          offY = y * chunkSize,
          offZ = z * chunkSize,
          maker = CHUNK();

      chunk = this.getChunk(x, y, z);
      if(chunk)
        for(cx = 0; cx < chunkSize; cx++)
          for(cy = 0; cy < chunkSize; cy++)
            for(cz = 0; cz < chunkSize; cz++){
              type = chunk[cx + cy * chunkSize + cz * chunkSize * chunkSize];
              if(type != 0) maker.addAllSides((offX + cx) * CUBE_SIZE, (offY + cy) * CUBE_SIZE, (offZ + cz) * CUBE_SIZE, this.texture, CUBE_SIZE);
            }

      return maker.makeVBO(this.engine);
    },

    iterVisibleVBOs: function(callback){
      var ccx = 0, ccy = 0, ccz = 0, x, y, z, results = [];

      for (x = ccx - VIEW_DISTANCE_X; x <= ccx + VIEW_DISTANCE_X; x += 1) {
        for (y = ccy - VIEW_DISTANCE_Y; y <= ccy + VIEW_DISTANCE_Y; y += 1) {
          for (z = ccz - VIEW_DISTANCE_Z; z <= ccz + VIEW_DISTANCE_Z; z += 1) {
            vbo = this.getChunkVBO(x, y, z);
            if (!vbo) continue;
            results.push(callback(vbo));
          }
        }
      }

      return results;
    },

    update: function(dt){
    
    },

    draw: function() {
      this.texture.bind();
      var results = this.iterVisibleVBOs(function(vbo) {
        return vbo.draw();
      });
      this.texture.unbind();
      return results;
    }
  }
})();
