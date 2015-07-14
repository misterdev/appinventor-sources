'use strict';

goog.provide('Blockly.FolderIcon');
goog.require('Blockly.Folder');
goog.require('Blockly.MiniWorkspace');

Blockly.FolderIcon = function () {
    this.block_ = this;
    this.visible = false;
};

Blockly.FolderIcon.prototype.createIcon = function () {
    this.iconGroup_ = Blockly.createSvgElement('g', {}, null);
    this.block_.getSvgRoot().appendChild(this.iconGroup_);
    Blockly.bindEvent_(this.iconGroup_, 'mouseup', this, this.iconClick_);
    this.updateEditable();

    var quantum = Blockly.Icon.RADIUS / 2;
    var iconShield = Blockly.createSvgElement('rect',
        {'class': 'blocklyIconShield',
            'width': 4 * quantum,
            'height': 4 * quantum,
            'rx': quantum,
            'ry': quantum}, this.iconGroup_);
    this.iconMark_ = Blockly.createSvgElement('text',
        {'class': 'blocklyIconMark',
            'x': Blockly.Icon.RADIUS,
            'y': 2 * Blockly.Icon.RADIUS - 4}, this.iconGroup_);
    var icon = this.block_.expandedFolder_ ? "-" : "+";
    this.iconMark_.appendChild(document.createTextNode(icon));
};

Blockly.FolderIcon.prototype.renderIcon = function(cursorX) {
    if (this.block_.isCollapsed()) {
        this.iconGroup_.setAttribute('display', 'none');
        return cursorX;
    }
    this.iconGroup_.setAttribute('display', 'block');

    var TOP_MARGIN = 5;
    var diameter = 2 * Blockly.Icon.RADIUS;
    if (Blockly.RTL) {
        cursorX -= diameter;
    }
    this.iconGroup_.setAttribute('transform',
        'translate(' + cursorX + ', ' + TOP_MARGIN + ')');
    this.computeIconLocation();
    if (Blockly.RTL) {
        cursorX -= Blockly.BlockSvg.SEP_SPACE_X;
    } else {
        cursorX += diameter + Blockly.BlockSvg.SEP_SPACE_X;
    }
    return cursorX;
};


Blockly.FolderIcon.prototype.iconClick_ = function(e) {
    this.block_.promote();
    if (this.block_.isEditable()) {
        if (!this.block_.isInFlyout) {
            this.setVisible(!this.isVisible());
        }
    }
};

Blockly.FolderIcon.prototype.updateEditable = function() {

    if (this.block_.isEditable()) {
        // Default behaviour for an icon.
        if (!this.block_.isInFlyout) {
            Blockly.addClass_(/** @type {!Element} */ (this.iconGroup_),
                'blocklyIconGroup');
        } else {
            Blockly.removeClass_(/** @type {!Element} */ (this.iconGroup_),
                'blocklyIconGroup');
        }
    } else {
        // Close any mutator bubble.  Icon is not clickable.
        this.setVisible(false);
        Blockly.removeClass_(/** @type {!Element} */ (this.iconGroup_),
            'blocklyIconGroup');
    }
};

Blockly.FolderIcon.prototype.setVisible = function(visible) {
    if (visible == this.isVisible()) {
        // No change.
        return;
    }
    var miniworkspace = this.block_.miniworkspace;
    //If th mw is not rendered, create an empty miniworkspace
    if(!miniworkspace.rendered_ && !miniworkspace.isInFlyout){
        miniworkspace.renderWorkspace(this.block_);
    }

    if (visible) {
        // Create the bubble.        
        var width = this.block_.getHeightWidth().width;
        var position = this.block_.getRelativeToSurfaceXY();
        //Calculates the right coordinates if the folder block is inside a miniworkspace
        if(this.block_.isInFolder){
          var miniWorkspaceOrigin = Blockly.getRelativeXY_(this.block_.workspace.svgGroup_);
          var translate_ = this.block_.workspace.getTranslate();
          position.x += miniWorkspaceOrigin.x + parseInt(translate_[0]);
          position.y += miniWorkspaceOrigin.y + parseInt(translate_[1]);
        }
        miniworkspace.setAnchorLocation(position.x + width + 10, position.y + 20);

        miniworkspace.svgGroup_.setAttribute('visibility','visible');
        //Firefox has problems with hidden elements
        miniworkspace.resizeMiniWorkspace(miniworkspace.height_, miniworkspace.width_);
    } else {
        miniworkspace.svgGroup_.setAttribute('visibility','hidden');
    }

    this.block_.expandedFolder_ = visible;
    this.iconMark_.innerHTML = this.block_.expandedFolder_ ? "-" : "+";
    this.visible = visible;
};

Blockly.FolderIcon.prototype.getIconLocation = function() {
    return {x: this.iconX_, y: this.iconY_};
};

Blockly.FolderIcon.prototype.dispose = function() {
    this.block_.miniworkspace.disposeWorkspace();
    // Dispose of and unlink the icon.
    goog.dom.removeNode(this.iconGroup_);
    this.iconGroup_ = null;
    this.block_ = null;
};

Blockly.FolderIcon.prototype.computeIconLocation = function() {
    // Find coordinates for the centre of the icon and update the arrow.
    var blockXY = this.block_.getRelativeToSurfaceXY();
    var iconXY = Blockly.getRelativeXY_(this.iconGroup_);
    var  newX = blockXY.x + iconXY.x + Blockly.Icon.RADIUS;
    var newY = blockXY.y + iconXY.y + Blockly.Icon.RADIUS;
    if (newX !== this.iconX_ || newY !== this.iconY_) {
        this.setIconLocation(newX, newY);
    }
};

Blockly.FolderIcon.prototype.setIconLocation = function(x, y) {
    this.iconX_ = x;
    this.iconY_ = y;
    //Folder and miniworkspace don't have to be connected
    //if (this.isVisible()) {
        //this.block_.miniworkspace.setAnchorLocation(x, y);
    //}
};

Blockly.FolderIcon.prototype.isVisible = function () {
    return this.visible;
};