'use strict';

goog.provide('Blockly.MiniWorkspace');
goog.require('Blockly.Workspace');
goog.require('Blockly.ScrollbarPair');


/**
 * Class for a mini workspace. 
 * @extends {Blockly.Icon}
 * @constructor
 */
Blockly.MiniWorkspace = function(folder,getMetrics,setMetrics) {
    Blockly.MiniWorkspace.superClass_.constructor.call(this, getMetrics, setMetrics);
    //this.getMetrics = getMetrics;
    //this.setMetrics = setMetrics;

    this.block_ = folder;
    this.topBlocks_ = [];
    this.maxBlocks = Infinity;
    this.svgGroup_ = null;
    this.svgBlockCanvas_ = null;
    this.svgMiniWorkspaceCanvas_ = null;
    this.svgBubbleCanvas_ = null;
    this.svgGroupBack_ = null;
    this.svgPlaceholder_ = null;
    this.isMW = true;
};

goog.inherits(Blockly.MiniWorkspace, Blockly.Workspace);

Blockly.MiniWorkspace.DEFAULT_HEIGHT = 200;
Blockly.MiniWorkspace.DEFAULT_WIDTH = 250;

Blockly.MiniWorkspace.prototype.rendered_ = false;
Blockly.MiniWorkspace.prototype.scrollbar_ = true;

Blockly.MiniWorkspace.prototype.anchorX_ = 0;
Blockly.MiniWorkspace.prototype.anchorY_ = 0;

Blockly.MiniWorkspace.prototype.relativeLeft_ = 0;
Blockly.MiniWorkspace.prototype.relativeTop_ = 0;
Blockly.MiniWorkspace.prototype.relativeLeft_ = 0;

Blockly.MiniWorkspace.prototype.width_ = Blockly.MiniWorkspace.DEFAULT_WIDTH;
Blockly.MiniWorkspace.prototype.height_ = Blockly.MiniWorkspace.DEFAULT_HEIGHT;

Blockly.MiniWorkspace.prototype.autoLayout_ = true;

Blockly.MiniWorkspace.getWorkspaceMetrics_ = function () {
    var doubleBorderWidth = 2 * Blockly.Bubble.BORDER_WIDTH;
    //We don't use Blockly.Toolbox in our version of Blockly instead we use drawer.js
    //svgSize.width -= Blockly.Toolbox.width;  // Zero if no Toolbox.
    var viewWidth = this.width_ - doubleBorderWidth;
    var viewHeight = this.height_ - doubleBorderWidth;
    try {
        var blockBox = this.getCanvas().getBBox();
    } catch (e) {
        // Firefox has trouble with hidden elements (Bug 528969).
        return null;
    }
    if (this.scrollbar_) {
        // Add a border around the content that is at least half a screenful wide.
        // Ensure border is wide enough that blocks can scroll over entire screen.
        var leftEdge = Math.min(blockBox.x - viewWidth / 2,
            blockBox.x + blockBox.width - viewWidth);
        var rightEdge = Math.max(blockBox.x + blockBox.width + viewWidth / 2,
            blockBox.x + viewWidth);
        var topEdge = Math.min(blockBox.y - viewHeight / 2,
            blockBox.y + blockBox.height - viewHeight);
        var bottomEdge = Math.max(blockBox.y + blockBox.height + viewHeight / 2,
            blockBox.y + viewHeight);
    } else {
        var leftEdge = blockBox.x;
        var rightEdge = leftEdge + blockBox.width;
        var topEdge = blockBox.y;
        var bottomEdge = topEdge + blockBox.height;
    }
    //We don't use Blockly.Toolbox in our version of Blockly instead we use drawer.js
    //var absoluteLeft = Blockly.RTL ? 0 : Blockly.Toolbox.width;
    var absoluteLeft = Blockly.RTL ? 0 : 0;
    var metrics = {
        viewHeight: viewHeight,
        viewWidth: viewWidth,
        contentHeight: bottomEdge - topEdge,
        contentWidth: rightEdge - leftEdge,
        viewTop: -this.scrollY,
        viewLeft: -this.scrollX,
        contentTop: topEdge,
        contentLeft: leftEdge,
        absoluteTop: 0,
        absoluteLeft: absoluteLeft
    };
    return metrics;
};

Blockly.MiniWorkspace.setWorkspaceMetrics_ = function(xyRatio) {
    if (!this.scrollbar) {
        throw 'Attempt to set mini workspace scroll without scrollbars.';
    }
    var metrics = this.getMetrics();//Blockly.MiniWorkspace.getWorkspaceMetrics_();
    if (goog.isNumber(xyRatio.x)) {
        this.scrollX = -metrics.contentWidth * xyRatio.x -
        metrics.contentLeft;
    }
    if (goog.isNumber(xyRatio.y)) {
        this.scrollY = -metrics.contentHeight * xyRatio.y -
        metrics.contentTop;
    }
    var translation = 'translate(' +
        (this.scrollX + metrics.absoluteLeft) + ',' +
        (this.scrollY + metrics.absoluteTop) + ')';
    var inverseTranslation = 'translate(' +
        (-(this.scrollX + metrics.absoluteLeft)) + ',' +
        (-(this.scrollY + metrics.absoluteTop)) + ')';
    this.getCanvas().setAttribute('transform', translation);
    this.getBubbleCanvas().setAttribute('transform',
        translation);
};

//TODO
Blockly.MiniWorkspace.prototype.renderWorkspace = function (folder, xml, height, width) {

    Blockly.ConnectionDB.init(this);
    this.block_.expandedFolder_ = false;
    this.workspace_ = folder.workspace;
    this.shape_ = folder.svg_.svgPath_;
    //var canvas = Blockly.mainWorkspace.getCanvas();
    //canvas.appendChild(this.createDom_());
    Blockly.mainWorkspace.getCanvas().appendChild(this.createPlaceholder_());
    Blockly.mainWorkspace.getMiniWorkspaceCanvas().appendChild(this.createDom_());
    //this.setAnchorLocation(0, 0);
    this.svgGroupBack_.setAttribute('transform','translate(-5,-25)');
    this.svgGroup_.setAttribute('visibility','hidden');
    this.svgTitle_.setAttribute('transform','translate(31, -7.5)');
    this.iconGroup_.setAttribute('transform','translate(5, -20)');

    this.rendered_ = true;
    this.scrollbar = new Blockly.ScrollbarPair(this);

    this.topBlocks_ = [];

    if (xml) {
        this.clear();
        Blockly.Xml.domToWorkspace(this, xml);
    }

    this.render();
    if(height && width){
        this.resizeMiniWorkspace(height, width);
    } else {
        this.resizeMiniWorkspace();
    }

    if (!Blockly.readOnly) {
        Blockly.bindEvent_(this.svgGroupBack_, 'mousedown', this,
            this.miniWorkspaceHeaderMouseDown_);
        if (this.resizeGroup_) {
          Blockly.bindEvent_(this.resizeGroup_, 'mousedown', this,
                             this.resizeMouseDown_);
        }
    }
};

//TODO
Blockly.MiniWorkspace.prototype.disposeWorkspace = function () {
    /*for (var i = 1; i < 5; i++) {
        console.log(i+" "+this.connectionDBList[i].length);
    }*/

    Blockly.MiniWorkspace.unbindDragEvents_();
    while (this.topBlocks_.length > 0) {
        this.topBlocks_[0].dispose();
    }
    // Dispose of and unlink the bubble.
    goog.dom.removeNode(this.svgGroup_);
    goog.dom.removeNode(this.svgPlaceholder_);
    this.svgGroup_ = null;
    this.svgBlockCanvas_ = null;
    this.svgBubbleCanvas_ = null;
    this.svgGroupBack_ = null;
    this.svgPlaceholder_ = null;
    this.iconGroup_ = null;
    this.workspace_ = null;
    this.content_ = null;
    this.shape_ = null;
    this.block_.expandedFolder_ = false;

};

Blockly.MiniWorkspace.prototype.createDom_ = function () {
    this.svgGroup_ = Blockly.createSvgElement('g', {}, null);
    Blockly.bindEvent_(this.svgGroup_, 'resize', this, this.onResize_);

    var svgGroupEmboss = Blockly.createSvgElement('g',
        {'filter': 'url(#blocklyEmboss)'}, this.svgGroup_);

    this.svgBlockCanvasOuter_ = Blockly.createSvgElement('svg', 
        {'height': Blockly.MiniWorkspace.DEFAULT_HEIGHT +'px', 'width': Blockly.MiniWorkspace.DEFAULT_WIDTH+'px'}, this.svgGroup_);

    Blockly.createSvgElement('rect',
        {'class': 'blocklyFolderBackground',
            'height': '100%', 'width': '100%'}, this.svgBlockCanvasOuter_);

    this.svgBlockCanvas_ = Blockly.createSvgElement('g', {}, this.svgBlockCanvasOuter_);

    Blockly.bindEvent_(this.svgBlockCanvas_, 'mousedown', this, this.miniWorkspaceMouseDown_);
    Blockly.bindEvent_(this.svgBlockCanvas_, 'blocklyWorkspaceChange', this,
      function(e) {
        e.stopPropagation();
    });

    this.svgBubbleCanvas_ = Blockly.createSvgElement('g', {'height': '100%', 'width': '100%'}, this.svgBlockCanvasOuter_);
    this.svgGroupBack_ = Blockly.createSvgElement('rect',
        {'class': 'blocklyDraggable', 'x': 0, 'y': 0,
            'rx': Blockly.Bubble.BORDER_WIDTH, 'ry': Blockly.Bubble.BORDER_WIDTH},
        svgGroupEmboss);
    this.svgBlockCanvasOuterBack_ =Blockly.createSvgElement('rect',
        {'class':'blocklyMutatorBackground',
            'height': Blockly.MiniWorkspace.DEFAULT_HEIGHT +'px', 'width': Blockly.MiniWorkspace.DEFAULT_WIDTH+'px'}, svgGroupEmboss);
    this.svgTitle_ = Blockly.createSvgElement('text',{
        'class':'blocklyText'},this.svgGroup_);
    this.svgTitle_.innerHTML=this.block_.getFolderName();

    // Button to collapse the miniworkspace 
    this.iconGroup_ = Blockly.createSvgElement('g', {'class': 'blocklyIconGroup'}, this.svgGroup_);
    Blockly.bindEvent_(this.iconGroup_, 'mouseup', this, function(){
        this.block_.folderIcon.setVisible(false);
    });
    var quantum = Blockly.Icon.RADIUS / 2;
    var iconShield = Blockly.createSvgElement('rect',
        {'class': 'blocklyIconShield',
            'width': 4 * quantum,
            'height': 4 * quantum,
            'rx': quantum,
            'ry': quantum}, this.iconGroup_);
    var iconMark_ = Blockly.createSvgElement('text',
        {'class': 'blocklyIconMark',
            'x': Blockly.Icon.RADIUS,
            'y': 2 * Blockly.Icon.RADIUS - 4}, this.iconGroup_);
    iconMark_.appendChild(document.createTextNode("-"));

    // Bottom right corner used to resize the miniworkspace
    this.resizeGroup_ = Blockly.createSvgElement('g',
        {'class': Blockly.RTL ? 'blocklyResizeSW' : 'blocklyResizeSE'},
        this.svgGroup_);
    var resizeSize = 2 * Blockly.Bubble.BORDER_WIDTH;
    Blockly.createSvgElement('polygon',
        {'points': '0,x x,x x,0'.replace(/x/g, resizeSize.toString())},
        this.resizeGroup_);
    Blockly.createSvgElement('line',
        {'class': 'blocklyResizeLine',
        'x1': resizeSize / 3, 'y1': resizeSize - 1,
        'x2': resizeSize - 1, 'y2': resizeSize / 3}, this.resizeGroup_);
    Blockly.createSvgElement('line',
        {'class': 'blocklyResizeLine',
        'x1': resizeSize * 2 / 3, 'y1': resizeSize - 1,
        'x2': resizeSize - 1, 'y2': resizeSize * 2 / 3}, this.resizeGroup_);

    return this.svgGroup_;
};

Blockly.MiniWorkspace.prototype.createPlaceholder_ = function() {
    this.svgPlaceholder_ = Blockly.createSvgElement('rect', 
        {'visibility': 'hidden'}, null);
    return this.svgPlaceholder_;
};


Blockly.MiniWorkspace.prototype.addTopBlock = function(block) {
    block.workspace == this;
    block.isInFolder = true;
    this.topBlocks_.push(block);
    if (Blockly.Realtime.isEnabled() && this == Blockly.mainWorkspace) {
        Blockly.Realtime.addTopBlock(block);
    }
    this.fireChangeEvent();
};

Blockly.MiniWorkspace.prototype.setAnchorLocation = function (x,y) {
    this.anchorX_ = x;
    this.anchorY_ = y;
    if (this.rendered_) {
        this.positionMiniWorkspace_();
    }
};

Blockly.MiniWorkspace.prototype.positionMiniWorkspace_ = function () {
    var left;
    if (Blockly.RTL) {
        left = this.anchorX_ - this.relativeLeft_ - this.width_;
    } else {
        left = this.anchorX_ + this.relativeLeft_;
    }
    var top = this.relativeTop_ + this.anchorY_;
    this.svgGroup_.setAttribute('transform',
        'translate(' + left + ', ' + top + ')');
    this.svgPlaceholder_.setAttribute('transform',
        'translate(' + (left - 5) + ', ' + (top - 25) + ')');
};

Blockly.MiniWorkspace.prototype.moveNearPseudoBlock = function() {
    // Creates the bubble.        
    var width = this.block_.getHeightWidth().width;
    var position = this.block_.getRelativeToSurfaceXY();
    //Calculates the right coordinates if the folder block is inside a miniworkspace
    if(this.block_.isInFolder){
        var miniWorkspaceOrigin = Blockly.getRelativeXY_(this.block_.workspace.svgGroup_);
        var translate_ = this.block_.workspace.getTranslate();
        position.x += miniWorkspaceOrigin.x + parseInt(translate_[0]);
        position.y += miniWorkspaceOrigin.y + parseInt(translate_[1]);
    }
    this.setAnchorLocation(position.x + width + 10, position.y + 20);
};

Blockly.MiniWorkspace.prototype.getCoordinates = function(){
    var x = this.anchorX_ + this.relativeLeft_;
    var y = this.anchorY_ + this.relativeTop_;
    return {'x': x, 'y':y};
};

Blockly.MiniWorkspace.prototype.updateTitle = function () {
    this.svgTitle_.innerHTML = this.block_.getFolderName();
    this.resizeTitle();
};

Blockly.MiniWorkspace.prototype.resizeTitle = function () {
    var titleTranslate_ = this.svgTitle_.getAttribute("transform");
    titleTranslate_ = titleTranslate_.split("(")[1].split(")")[0].split(",");

    var headerWidth = this.svgBlockCanvasOuter_.getBBox().width - 
        parseInt(titleTranslate_[0]) - Blockly.Bubble.BORDER_WIDTH*2;
    this.svgTitle_.innerHTML = this.block_.getFolderName();

    while(this.svgTitle_.getBBox().width > headerWidth) {
        this.svgTitle_.innerHTML = this.svgTitle_.innerHTML.slice(0, -1);
    }
    if(this.block_.getFolderName().length > this.svgTitle_.innerHTML.length) {
        this.svgTitle_.innerHTML += '...';
    }
};

Blockly.MiniWorkspace.prototype.resizeMiniWorkspace = function(height, width){
    if(!height){
        height = Blockly.MiniWorkspace.DEFAULT_HEIGHT;
    } else if(height < 100){
        height = 100;
    }   
    if(!width){
        width = Blockly.MiniWorkspace.DEFAULT_WIDTH;
    }  else if(width < 100){
        width = 100;
    } 
    this.svgBlockCanvasOuter_.setAttribute('width', width);
    this.svgBlockCanvasOuter_.setAttribute('height', height);
    this.svgBlockCanvasOuterBack_.setAttribute('width', width);
    this.svgBlockCanvasOuterBack_.setAttribute('height', height);

    this.width_ =  width + 2 * Blockly.Bubble.BORDER_WIDTH;
    this.height_ =  height + 2 * Blockly.Bubble.BORDER_WIDTH;
    var doubleBorderWidth = 2 * Blockly.Bubble.BORDER_WIDTH;
    //this.width_ = Math.max(this.width_, doubleBorderWidth + 45);
    //this.height_ = Math.max(this.height_, 30 + Blockly.BlockSvg.FIELD_HEIGHT);
    this.svgGroupBack_.setAttribute('width', this.width_);
    this.svgPlaceholder_.setAttribute('width', this.width_);
    //TODO constant for the header
    this.svgGroupBack_.setAttribute('height', this.height_ + 20);
    this.svgPlaceholder_.setAttribute('height', this.height_ + 20);
    //this.svgGroup_.setAttribute('width', this.width_);
    
    this.resizeGroup_.setAttribute('transform', 'translate(' +
        (width - doubleBorderWidth) + ', ' +
        (height - doubleBorderWidth) + ')');
    this.resizeTitle();
    
    Blockly.fireUiEvent(this.svgGroup_,'resize');

    this.positionMiniWorkspace_();
}

/**
 * Handle a mouse-down on miniworkspace's resize corner.
 * @param {!Event} e Mouse down event.
 * @private
 */
Blockly.MiniWorkspace.prototype.resizeMouseDown_ = function(e) {
  this.promote_();
  Blockly.MiniWorkspace.unbindDragEvents_();
  if (Blockly.isRightButton(e)) {
    // Right-click.
    return;
  }
  // Record the starting offset between the current location and the mouse.
  if (Blockly.RTL) {
    this.resizeDeltaWidth = this.width_ + e.clientX;
  } else {
    this.resizeDeltaWidth = this.width_ - e.clientX;
  }
  this.resizeDeltaHeight = this.height_ - e.clientY;

  Blockly.MiniWorkspace.onMouseUpWrapper_ = Blockly.bindEvent_(document,
      'mouseup', this, Blockly.MiniWorkspace.unbindDragEvents_);
  Blockly.MiniWorkspace.onMouseMoveWrapper_ = Blockly.bindEvent_(document,
      'mousemove', this, this.resizeMouseMove_);
  Blockly.hideChaff();
  // This event has been handled.  No need to bubble up to the document.
  e.stopPropagation();
};

/**
 * Resize this miniworkspace to follow the mouse.
 * @param {!Event} e Mouse move event.
 * @private
 */
Blockly.MiniWorkspace.prototype.resizeMouseMove_ = function(e) {
  this.autoLayout_ = false;
  var w = this.resizeDeltaWidth;
  var h = this.resizeDeltaHeight + e.clientY;
  if (Blockly.RTL) {
    // RTL drags the bottom-left corner.
    w -= e.clientX;
  } else {
    // LTR drags the bottom-right corner.
    w += e.clientX;
  }
  this.resizeMiniWorkspace(h, w);
  if (Blockly.RTL) {
    // RTL requires the bubble to move its left edge.
    //this.positionBubble_();
  }
};

Blockly.MiniWorkspace.prototype.miniWorkspaceHeaderMouseDown_ = function (e) {
    this.promote_();
    Blockly.MiniWorkspace.unbindDragEvents_();
    if (Blockly.isRightButton(e)) {
        // Right-click.
        return;
    } else if (Blockly.isTargetInput_(e)) {
        // When focused on an HTML text input widget, don't trap any events.
        return;
    }
    this.miniWorkspaceMouseDown_(e);
    // Left-click (or middle click)
    Blockly.setCursorHand_(true);
    // Record the starting offset between the current location and the mouse.
    if (Blockly.RTL) {
        this.dragDeltaX =  this.relativeLeft_ + e.clientX;
    } else {
        this.dragDeltaX = this.relativeLeft_ - e.clientX;
    }
    this.dragDeltaY = this.relativeTop_ - e.clientY;

    Blockly.MiniWorkspace.onMouseUpWrapper_ = Blockly.bindEvent_(document,
        'mouseup', this, Blockly.MiniWorkspace.unbindDragEvents_);
    Blockly.MiniWorkspace.onMouseMoveWrapper_ = Blockly.bindEvent_(document,
        'mousemove', this, this.MiniWorkspaceHeaderMouseMove_);
    // This event has been handled.  No need to bubble up to the document.
    e.stopPropagation();
};

Blockly.MiniWorkspace.prototype.miniWorkspaceMouseDown_ = function (e) {
    this.promote_();
    //Blockly.MiniWorkspace.unbindDragEvents_();
    if (Blockly.isRightButton(e)) {
        // Right-click.
        return;
    } else if (Blockly.isTargetInput_(e)) {
        // When focused on an HTML text input widget, don't trap any events.
        return;
    }

    Blockly.focusedWorkspace_ = this;
    Blockly.onMouseDown_.call(this, e);

    // This event has been handled.  No need to bubble up to the document.
    e.stopPropagation();
};

Blockly.MiniWorkspace.unbindDragEvents_ = function() {
    if (Blockly.MiniWorkspace.onMouseUpWrapper_) {
        Blockly.unbindEvent_(Blockly.MiniWorkspace.onMouseUpWrapper_);
        Blockly.MiniWorkspace.onMouseUpWrapper_ = null;
    }
    if (Blockly.MiniWorkspace.onMouseMoveWrapper_) {
        Blockly.unbindEvent_(Blockly.MiniWorkspace.onMouseMoveWrapper_);
        Blockly.MiniWorkspace.onMouseMoveWrapper_ = null;
    }
    Blockly.fireUiEvent(window, 'resize');
};

Blockly.MiniWorkspace.prototype.MiniWorkspaceHeaderMouseMove_ = function(e) {
    this.autoLayout_ = false;
    if (Blockly.RTL) {
        this.relativeLeft_ = this.dragDeltaX - e.clientX;
    } else {
        this.relativeLeft_ = this.dragDeltaX + e.clientX;
    }
    this.relativeTop_ = this.dragDeltaY + e.clientY;
    this.positionMiniWorkspace_();
};

Blockly.MiniWorkspace.prototype.promote_ = function() {
    //var svgGroup = this.svgGroup_.parentNode;
    //svgGroup.appendChild(this.svgGroup_);
    Blockly.mainWorkspace.getMiniWorkspaceCanvas().appendChild(this.svgGroup_);
    this.block_.promote();
};

Blockly.MiniWorkspace.prototype.highlight_ = function(valid) {
    if(valid){
        Blockly.addClass_(/** @type {!Element} */ (this.svgGroupBack_),
            'blocklySelectedFolder');
    } else {
        Blockly.addClass_(/** @type {!Element} */ (this.svgGroupBack_),
            'blocklySelectedInvalidFolder');        
    }
};

Blockly.MiniWorkspace.prototype.unhighlight_ = function() {
    if(this.isValid){
        Blockly.removeClass_(/** @type {!Element} */ (this.svgGroupBack_),
            'blocklySelectedFolder');
    } else {
        Blockly.removeClass_(/** @type {!Element} */ (this.svgGroupBack_),
            'blocklySelectedInvalidFolder');
    }
};

Blockly.MiniWorkspace.prototype.spreadChangeEvent = function() {
  var workspace = this;
  if (workspace.fireChangeEventPid_) {
    window.clearTimeout(workspace.fireChangeEventPid_);
  }
  var canvas = workspace.svgBlockCanvas_;
  if (canvas) {
    workspace.fireChangeEventPid_ = window.setTimeout(function() {
        Blockly.fireUiEvent(canvas, 'blocklyWorkspaceChange');
      }, 0);
  }
};

Blockly.MiniWorkspace.prototype.onResize_ = function() {
    this.scrollbar.resize();
};