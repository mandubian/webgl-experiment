(function(){
  this.MatrixStack = function(){
    if ( !(this instanceof arguments.callee) ) return new arguments.callee(options);

    this.top = mat4.create();
    this.stack = [];
  }

  MatrixStack.prototype = {
    set: function(value){
      this.top = value;      
    },

    identity: function(){
      this.set(mat4.create());
    },

    multiply: function(mat){
      mat4.multiply(this.top, mat);
    },

    translate: function(vector){
      mat4.translate(this.top, vector);
    },

    rotate: function(angle, axis){
      mat4.rotate(this.top, angle, axis);
    },

    scale: function(vector){
      mat4.scale(this.top, vector);
    },

    push: function(mat){
      if(!mat){
        this.stack.push(mat4.create(mat));
        this.top = mat4.create(mat);
      }
      else{
        this.stack.push(mat4.create(mat));
      }
    },

    pop: function(){
      this.top = this.stack.pop();
      return this.top;
    }
  }
})();