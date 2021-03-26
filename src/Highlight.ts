import * as $ from 'jquery'
import { Subject } from 'rxjs';

export class Highlight {
  parentNodeId = '';
  sel = [];
  idx = 1000;
  highlightList = [];
  answerStrikeList = [];
  hlString = "";
  startOffset;
  endOffset;
  tempStartPoint;
  tempEndPoint;
  isChrome = /Chrome/.test(navigator.userAgent) && /Google Inc/.test(navigator.vendor);
  mouseSelection;
  textFound;
  previousNodeIsText = false;
  previousNodeIsBR = false;
  _onHighlightDeselect: Subject<{ highlightId: number, event: any }>;

  state = {
    highlight: 'true',
    strikeout: 'false'
  };

  action = {
    add: 1,
    remove: 2
  };

  hInfo = {
    id: '',
    elementDiv: '',
    start: '',
    end: '',
    currentState: ''
  };

  sInfo = {
    id: '',
    elementDiv: ''
  }

  rangeIntersectsNode = (typeof window.Range != "undefined" && Range.prototype.intersectsNode) ?
    function (range, node) {
      return range.intersectsNode(node);
    }
    :
    function (range, node) {

      var nodeRange = node.ownerDocument.createRange();
      try {

        nodeRange.selectNode(node);
      } catch (e) {
        alert('exception');
        nodeRange.selectNodeContents(node);
      }

      return range.compareBoundaryPoints(Range.END_TO_START, nodeRange) == -1 && range.compareBoundaryPoints(Range.START_TO_END, nodeRange) == 1;
    };

  constructor(loadString, _onHighlightDeselect) {
    this.clearHighlights();
    this.hlString = loadString;
    //list will contain highlights and strikeouts(for mcat only)
    this.highlightList = [];
    //list will contain strikeouts on answer choices from all products except mcat
    this.answerStrikeList = [];
    this.sel = [];
    this.parentNodeId = '';
    this.LoadHighlights(loadString);
    this._onHighlightDeselect = _onHighlightDeselect;
  }

  destroy() {
    this.clearHighlights();
    this.highlightList = null;
    this.answerStrikeList = null;
  }

  addHighlight() {
    this.selection(this.state.highlight, this.action.add);
  }

  removeHighlight(highlightId) {
    if (highlightId != null && highlightId != '') {
      this.deselectHighlight(highlightId, this.state.highlight);
    } else {
      this.selection(this.state.highlight, this.action.remove);
    }
  }

  //used by mobiles to add or remove using single button
  toggleHighlight() {
    this.selection(this.state.highlight, null);
  }

  toggleStrikeout() {
    this.selection(this.state.strikeout, null);
  }

  selection(currentState, currentAction) {

    this.parentNodeId = '';
    var text = "";
    var highlightId = this.idx++;

    var selText = window.getSelection();

    if (selText !== null && selText.toString().length < 1) {
      return;
    }

    var range = selText.getRangeAt(0);

    var duplicate_range = range;
    var startNode = range.startContainer, endNode = selText.focusNode;


    // Create an array of all the text nodes in the selection using a TreeWalker
    var containerElement = range.commonAncestorContainer;

    if (containerElement.nodeType != 1) {

      containerElement = containerElement.parentNode;
    }

    var selEndOffset = selText.focusOffset;

    //this is missing a product check
    if (startNode.nodeValue == endNode.nodeValue) {
      endNode = range.endContainer;
      selEndOffset = range.endOffset;
    }

    if (endNode.nodeName == 'SPAN' && selEndOffset == 0) {
      endNode = this.getLastTextNodesBetween(selText);
      selEndOffset = endNode.nodeValue.length;
    }
    if (startNode.nodeName == 'SPAN' && range.startOffset == 0) {
      // startNode = getFirstTextNodesBetween( sel );
      var _textNode = this.getFirstTextNodesBetween(selText);

      if (_textNode != null) {
        startNode = _textNode;
        (range as any).startOffset = 0;
      }
      //selEndOffset = endNode.nodeValue.length;
    }
    // Split the start and end container text nodes, if necessary


    if (endNode.nodeType === 3) {
      (endNode as any).splitText(selEndOffset);

      range.setEnd(endNode, (endNode as any).length);
    }


    if (startNode.nodeType === 3) {

      //change
      /* if (range.startOffset == startNode.nodeValue.length-1) {
           range.startOffset = range.startOffset - 1;
           alert('new range offset - ' + range.startOffset);
           duplicate_range.startOffset = duplicate_range.startOffset - 1;
       }*/
      //change
      startNode = (startNode as any).splitText(range.startOffset);

      range.setStart(startNode, 0);
    }
    //if (range.startOffset <= range.endOffset) {
    //    var tempNode = startNode;
    //    startNode = endNode;
    //    endNode = tempNode;
    //}
    if (this.findParentNodeId(containerElement) === null) {
      alert("Invalid highlight. Please highlight phrase/text within question or explanation. If you are trying to highlight a whole paragraph, please try the selection again by moving the selection boundaries.");
      this.clearSelection();
      return;
    }



    this.getCharacterCount(duplicate_range, this.parentNodeId);


    this.tempStartPoint = this.startOffset - 1;
    this.tempEndPoint = this.endOffset - 1;
    if (this.tempStartPoint < 0) {
      this.tempStartPoint = 0;
    }
    if (this.tempEndPoint < 0) {
      this.tempEndPoint = 0;
    }

    if (text[0] == " ")
      this.tempStartPoint++;


    if (currentAction == null) {
      currentAction = this.decideAction(this.parentNodeId, this.tempStartPoint, this.tempEndPoint, this.highlightList, currentState);
    }


    if (currentAction == this.action.remove)
      this.highlightList = this.processRemoveHighlight(highlightId, this.parentNodeId, this.tempStartPoint, this.tempEndPoint, this.highlightList, currentState);
    else if (currentAction == this.action.add)
      this.highlightList = this.processHighlights(highlightId, this.parentNodeId, this.tempStartPoint, this.tempEndPoint, this.highlightList, currentState);


    this.clearSelection();
  }

  LoadHighlights(loadString) {
    var hInfo = "";
    this.idx = 1000;

    if (loadString != null && loadString !== "") {
      var loadString_split = loadString.split('*');

      for (var i = 0; i < loadString_split.length; i++) {
        var params = loadString_split[i].split(',');
        if (parseInt(params[3]) <= 0) {
          this.highlightList = this.processHighlights(this.idx++, this.getElementDiv(params[3]), params[0] - 1, params[1] - 1, this.highlightList, params[2]);
        } else {
          this.sInfo.id = params[3];
          this.sInfo.elementDiv = 'answer';
          this.answerStrikeList.push(this.sInfo);
          this.sInfo = {} as any;
          this.answerStrikeoutOnLoad(params[3]);
        }

      }
    }
  }

  GetHighlightsString() {
    var h = '';
    let i;
    for (i = 0; i < this.highlightList.length; i++) {
      var hInfo = this.highlightList[i];
      if (hInfo !== null) {
        if (h === '') {
          h = h + (parseInt(hInfo.start) + 1) + "," + (parseInt(hInfo.end) + 1) + "," + hInfo.currentState + "," + this.getParentNodeId(hInfo.elementDiv);
        } else {
          h = h + "*" + (parseInt(hInfo.start) + 1) + "," + (parseInt(hInfo.end) + 1) + "," + hInfo.currentState + "," + this.getParentNodeId(hInfo.elementDiv);
        }
      }
    }

    for (i = 0; i < this.answerStrikeList.length; i++) {
      var sInfo = this.answerStrikeList[i];
      if (sInfo !== null) {
        if (h === '') {
          h = h + (1 + "," + 1 + ",false," + sInfo.id);
        } else {
          h = h + "*" + (1 + "," + 1 + ",false," + sInfo.id);
        }
      }
    }
    return h;
  }

  StrikeOutAnswerByID(answerId) {
    //var sInfo = { "elementDiv": "answer", "id": answerId };
    this.sInfo.id = answerId;
    this.sInfo.elementDiv = 'answer';
    this.answerStrikeList.push(this.sInfo);
    this.sInfo = {} as any;
    this.answerStrikeoutOnLoad(answerId);
  }

  AnswerStrikeout(spanObj) {

    var answerId = spanObj.id.replace("answerhighlight", "");
    if (spanObj.innerHTML.indexOf('<strike>') != -1) {
      this.unstrikeoutText(spanObj);
      this.answerStrikeList = this.findOtherStrikeObjectByID(this.answerStrikeList, answerId)
    } else {
      this.strikeoutText(spanObj);
      this.sInfo.id = answerId;
      this.sInfo.elementDiv = 'answer';
      //var sInfo = { "elementDiv": "answer", "id": answerId };
      this.answerStrikeList.push(this.sInfo);
      this.sInfo = {} as any;
    }
  }

  //this method is used by all other products except mcat to remove highlight on click
  deselectHighlight(highlightId, currentState) {
    //fetch the corresponding highlight from highlight list
    var tempHighlightObj = $.grep(this.highlightList, function (i) {
      return i.id == highlightId;
    });

    if (tempHighlightObj.length > 0) {
      this.parentNodeId = tempHighlightObj[0].elementDiv;
      this.tempStartPoint = tempHighlightObj[0].start;
      this.tempEndPoint = tempHighlightObj[0].end;
    }

    this.highlightList = this.processRemoveHighlight(highlightId, this.parentNodeId, this.tempStartPoint, this.tempEndPoint, this.highlightList, currentState);
    this.clearSelection();

  }

  //this method is used by collegeprep to remove strikeouts on submit
  removeAllStrikeouts() {
    this.answerStrikeList = [];
  };

  //Processes Range data to handle any highlight overlaps or removals
  processHighlights(highlightId, ele, start, end, highlightList, currentState) {



    if (ele != "" && start <= end) {
      //var hInfo = { "id": highlightId, "elementDiv": ele, "start": start, "end": end, "currentState": currentState };
      let hInfo = {} as any;
      hInfo.id = highlightId;
      hInfo.elementDiv = ele;
      hInfo.start = start;
      hInfo.end = end;
      hInfo.currentState = currentState;
      highlightList.push(hInfo);
      hInfo = {};
    }

    highlightList.sort(this.compareStart);
    //hl => hl.elementDiv
    const hlGrouped = this.groupBy(highlightList, function (hl) { return hl.elementDiv });

    var qtList = hlGrouped.get("questionText");
    var exList = hlGrouped.get("explanation");
    var qaList = hlGrouped.get("questionAbstract");
    var atList = hlGrouped.get("answerChoicesDiv");
    var ccList = hlGrouped.get("view-lecture-article");

    qtList = this.mergeHighlights(qtList, currentState);
    exList = this.mergeHighlights(exList, currentState);
    qaList = this.mergeHighlights(qaList, currentState);
    atList = this.mergeHighlights(atList, currentState);
    ccList = this.mergeHighlights(ccList, currentState);


    highlightList = [];
    if (qtList != null)
      highlightList = highlightList.concat(qtList);
    if (exList != null)
      highlightList = highlightList.concat(exList);
    if (qaList != null)
      highlightList = highlightList.concat(qaList);
    if (atList != null)
      highlightList = highlightList.concat(atList);
    if (ccList != null)
      highlightList = highlightList.concat(ccList);

    this.clearHighlights();
    for (var j = 0; j < highlightList.length; j++) {
      this.select(highlightList[j].id, highlightList[j].elementDiv, highlightList[j].start, highlightList[j].end, highlightList[j].currentState);
    }

    return highlightList;
  }

  //Primary function called to remove a highlight
  processRemoveHighlight(highlightId, ele, start, end, highlightList, currentState) {

    if (highlightList.length > 0) {
      let hInfo = {} as any;
      hInfo.id = highlightId;
      hInfo.elementDiv = ele;
      hInfo.start = start;
      hInfo.end = end;
      hInfo.currentState = currentState;
      //var rInfo = { "id": highlightId, "elementDiv": ele, "start": start, "end": end, "currentState": currentState };
      highlightList.sort(this.compareStart);

      var hList = this.findObjectByElement(highlightList, ele);
      highlightList = this.findOtherObjectByElement(highlightList, ele);
      var r = this.removeHighlightFunction(hList, hInfo);

      highlightList = highlightList.concat(r);

      this.clearHighlights();
      for (var j = 0; j < highlightList.length; j++) {
        this.select(highlightList[j].id, highlightList[j].elementDiv, highlightList[j].start, highlightList[j].end, highlightList[j].currentState);
      }
    }

    //changed condition from || to && due to issue in removing highlights while testing lecture highlights 03/11
    highlightList = $.grep(highlightList, function (item) {
      return item.start != item.end && item.start != item.end + 1;
    })

    var elementObj = document.getElementById(ele);
    if (elementObj != null)
      elementObj.normalize();
    return highlightList;
  }

  decideAction(ele, start, end, highlightList, currentState) {
    var stateFlag = "";
    if (currentState == this.state.highlight)
      stateFlag = "true";
    else
      stateFlag = "false";
    var hlist = $.grep(highlightList, function (item) {
      return item.elementDiv == ele && item.currentState == stateFlag;
    })

    var canAdd = true;

    for (var i = 0; i < hlist.length; i++) {
      if (hlist[i].start <= start && hlist[i].end >= end) {
        canAdd = false;
        break;
      } else if (hlist[i].start <= start && hlist[i].end >= end) {
        canAdd = false;
        break;
      }
    }

    if (canAdd)
      return this.action.add;
    else
      return this.action.remove;
  }

  compareStart(a, b) {
    if (a.start < b.start)
      return -1;
    if (a.start > b.start)
      return 1;
    return 0;
  }

  groupBy(list, keyGetter) {
    const map = new Map();
    list.forEach(function (item) {
      const key = keyGetter(item);
      const collection = map.get(key);
      if (!collection) {
        map.set(key, [item]);
      } else {
        collection.push(item);
      }
    });
    return map;
  }

  findObjectByElement(array, ele) {
    var a = [];
    for (var i = 0; i < array.length; i++) {
      if (array[i].elementDiv === ele) {
        a.push(array[i]);
      }
    }
    return a;
  }

  findOtherObjectByElement(array, ele) {
    var a = [];
    for (var i = 0; i < array.length; i++) {
      if (array[i].elementDiv !== ele) {
        a.push(array[i]);
      }
    }
    return a;
  }

  findOtherStrikeObjectByID(array, id) {
    var a = [];
    for (var i = 0; i < array.length; i++) {
      if (array[i].id !== id) {
        a.push(array[i]);
      }
    }
    return a;
  }

  mergeHighlights(hList, currentState) {

    if (hList == null)
      return;
    if (hList.length < 1)
      return;

    var stack = [];

    //this list will contain either highlight/strikeouts which needs to be merged
    var tempList = [];
    //this list will contain the remaining items from list which we should concat after  processing is complete
    var concatList = [];
    if (currentState == this.state.highlight) {
      tempList = $.grep(hList, (i) => {
        return i.currentState == this.state.highlight;
      });

      concatList = $.grep(hList, (i) => {
        return i.currentState == this.state.strikeout;
      });
    } else if (currentState == this.state.strikeout) {
      tempList = $.grep(hList, (i) => {
        return i.currentState == this.state.strikeout;
      });

      concatList = $.grep(hList, (i) => {
        return i.currentState == this.state.highlight;
      });
    }

    if (tempList.length > 0) {
      stack = [tempList[0]];

      var correctionIndex = 0;
      var correctionDone = false;
      for (var i = 1; i < tempList.length; i++) {

        var top = stack[stack.length - 1];
        if (top.end < tempList[i].start) {
          stack.push(tempList[i]);
          correctionIndex = 0;
          continue;
        }


        if (top.end < tempList[i].end) {

          if (top.end == tempList[i].start)
            stack[stack.length - 1].end = tempList[i].end + 1;
          else
            stack[stack.length - 1].end = tempList[i].end;
        }
      }
    }
    return stack.concat(concatList);
  }

  removeHighlightFunction(hList, rInfo) {

    if (hList == null)
      return;
    if (hList.length < 1)
      return;

    var stack = [];
    //this list will contain either highlight/strikeouts which needs to be removed
    var tempList = [];
    //this list will contain the remaining items from list which we should concat after  processing is complete
    var concatList = [];

    var tempCurState = rInfo.currentState;

    if (tempCurState == this.state.highlight) {
      tempList = $.grep(hList, i => i.currentState == this.state.highlight);
      concatList = $.grep(hList, i => i.currentState == this.state.strikeout);
    } else if (tempCurState == this.state.strikeout) {
      tempList = $.grep(hList, i => i.currentState == this.state.strikeout);
      concatList = $.grep(hList, i => i.currentState == this.state.highlight);
    }

    if (tempList.length > 0) {
      for (var i = 0; i < tempList.length; i++) {
        if (tempList[i].start != tempList[i].end) {
          if (tempList[i].end < rInfo.start) {
            stack.push(tempList[i]);
            continue;
          }
          if (tempList[i].start > rInfo.end) {
            stack.push(tempList[i]);
            continue;
          }

          if (tempList[i].start >= rInfo.start && tempList[i].start <= rInfo.end) {
            tempList[i].start = rInfo.end;
            stack.push(tempList[i]);
            continue;
          }
          if (tempList[i].end >= rInfo.start && tempList[i].end <= rInfo.end) {
            tempList[i].end = rInfo.start;
            stack.push(tempList[i]);
            continue;
          }
          //set the id of the original highlight here after splitting it into 2 when removing highlight based on selection, this case will be true only for mcat
          if (tempList[i].start < rInfo.start && tempList[i].end > rInfo.end) {
            var first = { "id": tempList[i].id, "elementDiv": tempList[i].elementDiv, "start": tempList[i].start, "end": rInfo.start, "currentState": tempList[i].currentState };
            var second = { "id": tempList[i].id, "elementDiv": tempList[i].elementDiv, "start": rInfo.end, "end": tempList[i].end, "currentState": tempList[i].currentState };
            stack.push(first);
            stack.push(second);
          }
        }
      }
    }

    return stack.concat(concatList);
  }

  select(highlightId, elementId, start, end, currentState) {
    //var uniqueCssClass = "selection_" + (highlightId);

    var elementObj = document.getElementById(elementId);
    if (!elementObj) {
      return;
    }

    this.setSelectionRange(elementObj, start, end);
    if (this.sel !== null && this.sel.length < 1) {
      return;
    }

    var range = this.sel[0];
    var startNode = range.startContainer, endNode = range.endContainer;

    // Split the start and end container text nodes, if necessary
    if (endNode.nodeType == 3) {
      endNode.splitText(range.endOffset);
      range.setEnd(endNode, endNode.length);
    }

    if (startNode.nodeType == 3) {
      //alert(startNode.textContent + ' '  + range.startOffset);
      startNode = startNode.splitText(range.startOffset);
      range.setStart(startNode, 0);

    }

    // Create an array of all the text nodes in the selection using a TreeWalker
    var containerElement = range.commonAncestorContainer;
    if (containerElement.nodeType != 1) {
      containerElement = containerElement.parentNode;
    }


    var treeWalker = document.createTreeWalker(
      containerElement,
      NodeFilter.SHOW_TEXT,
      // Note that Range.intersectsNode is non-standard but implemented in WebKit
      (((node: any) => (this.rangeIntersectsNode(range, node) ? NodeFilter.FILTER_ACCEPT : NodeFilter.FILTER_REJECT)) as any),
      false
    );


    var selectedTextNodes = [];
    while (treeWalker.nextNode()) {

      selectedTextNodes.push(treeWalker.currentNode);
    }

    var textNode, anchorTag;

    var startVal = 0;

    //hack for IE - detect mouse selection
    if (this.checkIfIE() && this.mouseSelection) {
      startVal = 1;
      this.mouseSelection = false;
    }

    // Place each text node within range inside a new element with the desired class
    for (var i = startVal, len = selectedTextNodes.length; i < len; ++i) {
      //for (var i = selectedTextNodes.length - 1; i >= startVal; i--) {
      textNode = selectedTextNodes[i];

      //if (textNode.length > 0) {

      if (currentState == this.state.highlight) {
        if (textNode.textContent.trim() !== "") {
          anchorTag = document.createElement("h-tag");
          anchorTag.className = "textHighlight custom-color-1"; // TODO : this class can be provided by consumer.
          //anchorTag.setAttribute('onclick', 'checkBeforeDeselect(' + highlightId + ',event)');
          (anchorTag as HTMLElement).addEventListener('click', ($event) => { this._onHighlightDeselect.next({ highlightId: highlightId, event: $event }); })
          textNode.parentNode.insertBefore(anchorTag, textNode);
          anchorTag.appendChild(textNode);
        }
      } else {
        if (textNode.textContent.trim() !== "") {
          anchorTag = document.createElement("s-tag");
          anchorTag.className = "textStrikeout";
          textNode.parentNode.insertBefore(anchorTag, textNode);
          anchorTag.appendChild(textNode);
        }
      }
      //}
    }

    if (elementObj != null)
      elementObj.normalize();
    this.clearSelection();
  }

  setSelectionRange(el, start, end) {
    if (document.createRange && window.getSelection) {

      var range = document.createRange();
      range.selectNodeContents(el);
      this.textFound = false;
      this.previousNodeIsText = false;
      var textNodes = this.getAllTextNodesIn(el);
      var foundStart = false;
      var foundText = false;

      var charCount = 0, endCharCount;

      for (var i = 0, textNode; textNode = textNodes[i++];) {
        if (this.isSkipCountNode(textNode.nodeName, foundText)) {

          start = start - 1;
          end = end - 1;
          if (start < 0) {
            start = 0;
          }
          if (end < 0) {
            end = 0;
          }

          continue;
        }

        //if ($scope.globalConstants.topLevelProductId == $scope.clientConstants.topLevelProduct.mcat || $scope.globalConstants.topLevelProductId == $scope.clientConstants.topLevelProduct.collegeprep) {
        if (textNode.nodeType === 3 && textNode.nodeValue !== null && textNode.nodeValue.length > 0) {
          if (textNode.nodeValue.trim().length == 0) {
            start = start + textNode.nodeValue.length;
            end = end + textNode.nodeValue.length;
          }
        }
        //}
        if (textNode.nodeType === 3 && textNode.nodeValue !== null && textNode.nodeValue.length > 0) {
          foundText = true;
        }

        endCharCount = charCount + textNode.length;
        if (!foundStart && start >= charCount && (start < endCharCount || (start == endCharCount && i < textNodes.length))) {
          range.setStart(textNode, start - charCount);
          foundStart = true;
        }

        if (foundStart && end <= endCharCount) {
          if (end <= charCount) {
            range.setEnd(textNode, 1);
          } else {
            range.setEnd(textNode, end - charCount);
          }

          break;
        }

        charCount = endCharCount;
      }


      this.sel = [];
      if (foundStart) {
        this.sel.push(range);
      }

      return this.sel;
    }
    return null;
  }

  findParentNodeId(el) {
console.log(el)
    if (el.id == 'questionText' || el.id == 'explanation' || el.id == 'questionAbstract' || el.id == 'answerChoicesDiv' || el.id == 'view-lecture-article') {
      this.parentNodeId = el.id;
      return el;
    }
    while (el.parentNode) {
      el = el.parentNode;
      if (el.id == 'questionText' || el.id == 'explanation' || el.id == 'questionAbstract' || el.id == 'answerChoicesDiv' || el.id == 'view-lecture-article') {
        this.parentNodeId = el.id;
        return el;
      }

    }
    return null;
  }

  getCharacterCount(range, elementid) {


    //initialize offsets
    this.startOffset = 0;
    this.endOffset = 0;
    this.previousNodeIsText = false;
    this.textFound = false;
    //get all text nodes in range. We don't care about other nodes.
    var textNodes = this.getAllTextNodesIn(document.getElementById(elementid));

    var charCount = 0;
    var foundText = false;
    var foundStartNode = false;
    var children = null;
    if (range.commonAncestorContainer.nodeType != 3)
      children = range.commonAncestorContainer.childNodes;


    for (var i = 0, textNode; textNode = textNodes[i++];) {
      // if start node of range add number of characters of previous nodes to start offset of range from current node to get the total start value
      if (this.isSkipCountNode(textNode.nodeName, foundText)) {
        // alert("node name : " + textNode.nodeName + " value : " +  textNode.nodeValue);
        charCount = charCount + 1;
      }

      if (textNode.nodeType === 3 && textNode.nodeValue !== null && textNode.nodeValue.trim().length > 0) {
        foundText = true;

      }
      //change
      else if (elementid.indexOf('bstract') != -1 || elementid.indexOf('answer') != -1) {
        //alert('element id' + elementid);

        continue;
      }

      if (textNode == range.startContainer) {
        //need 1-based index so add offset of 1

        //change
        /*if (range.startContainer.length != range.startContainer.data.replace(/^\s+/, "").length) {
            startOffset = charCount + range.startOffset + 2;
        } else {
            startOffset = charCount + range.startOffset + 1;
        }*/
        foundStartNode = true;
        //if you double click word before the highlighted one, end node is empty
        //change
        //endOffset = startOffset + range.startContainer.length;

        this.startOffset = charCount + range.startOffset + 1;
      }
      //if end node of range add number of characters of previous nodes to end offset of range from current node to get the total end value

      if (textNode == range.endContainer) {
        //need 1-based index so add offset of 1
        //if (range.startContainer.length != range.startContainer.data.replace(/\s+$/, "").length) {

        this.endOffset = charCount + range.endOffset + 1;

        //}else {
        //endOffset = charCount + range.endOffset + 1;
        //}

        //if you double click the word next to highlighted one, start node is empty.
        if (this.startOffset == 0 && !foundStartNode) {

          this.startOffset = charCount + 1;
        }

        //if we find the end node no further processing is needed. So break from the loop
        break;
      }



      //above cannot recognise start or end node
      if (this.startOffset == 0 || this.endOffset == 0) {

        if (textNode.nodeValue == window.getSelection().toString()) {

          if (children != null) {
            for (var k = 0; k < children.length; k++) {
              if (children[k].nodeType === 3) {
              } else if (children[k].nodeName == "H-TAG" || children[k].nodeName == "S-TAG") {
                var tagChildren = children[k].childNodes;
                for (var x = 0; x < tagChildren.length; x++) {
                  if (textNode == tagChildren[x]) {
                    if (this.startOffset == 0)
                      this.startOffset = charCount + 1;
                    if (this.endOffset == 0)
                      this.endOffset = tagChildren[x].length + charCount + 1;

                  }
                }

              }
            }
          }
        }
      }


      //don't add number of characters if text node doesn't contain any text
      //if ($scope.globalConstants.topLevelProductId != $scope.clientConstants.topLevelProduct.mcat && $scope.globalConstants.topLevelProductId != $scope.clientConstants.topLevelProduct.collegeprep) {
      if (textNode.nodeValue !== null) {
        charCount = charCount + textNode.nodeValue.length;
      }
      /* } else {
          if (textNode.nodeValue !== null && textNode.nodeValue.trim().length > 0) {
              charCount = charCount + textNode.nodeValue.length;
          }
      } */


    }



  }

  getAllTextNodesIn(node) {

    this.textFound = false;
    this.previousNodeIsText = false;
    this.previousNodeIsBR = false;
    return this.getTextNodesIn(node);
  }

  getTextNodesIn(node) {

    var textNodes = [];

    if (node.nodeType == 1 && (node.parentNode.id.indexOf('LineNumbers') != -1 || node.id.indexOf('LineNumbers') != -1)) {
    }
    else if (node.nodeType == 3) {
      if ((node.parentNode.nodeName == 'SPAN' || node.parentNode.nodeName == 'H-TAG' || node.parentNode.nodeName == 'S-TAG') && node.parentNode.id.indexOf('LN') != -1) {
        //if ((node.parentNode.nodeName == 'SPAN') && node.parentNode.id.indexOf('LN') != -1) {

        if ((this.trim(node.nodeValue).length > 0) && !this.textFound) {
          this.textFound = true;
        }
        this.previousNodeIsText = true;
        this.previousNodeIsBR = false;
      } else {
        if ((this.trim(node.nodeValue).length > 0) && !this.textFound) {
          this.textFound = true;
        }
        this.previousNodeIsText = true;
        this.previousNodeIsBR = false;

        let blankText = false;
        let _nodeVal = this.trim(this.removeNewLine(node.nodeValue))
        if (_nodeVal == '&nbsp;' || _nodeVal == '') blankText = true;
        if (this.textFound && !blankText) 
          textNodes.push(node);

        //if (textFound)
        //    textNodes.push(node);
      }

    } else {
      var children = node.childNodes;
      if ((node.nodeName == 'P' && this.textFound) || (node.nodeName == 'LI') || (node.nodeName == 'BLOCKQUOTE') || (node.nodeName == 'TD' && this.textFound) || (node.nodeName == 'IMG' && this.textFound) || (node.nodeName == 'BR' && this.previousNodeIsText)) {

        if (node.nodeName == 'TD') {
          if (node.childNodes.length > 0) {
            if (node.childNodes[0].nodeName == 'OL' || node.childNodes[0].nodeName == 'UL' || node.childNodes[0].nodeName == 'P') {
              //do nothing
            } else {

              textNodes.push(node);
            }
          } else {
            textNodes.push(node);
          }
          this.previousNodeIsBR = false;
        } else {
          if (node.nodeName == 'BLOCKQUOTE') {
            if (node.childNodes.length > 0) {
              if (node.childNodes[0].nodeName == 'IMG' || node.childNodes[0].nodeType == 3 || node.childNodes[0].nodeName == 'A') {
                textNodes.push(node);
              }
            }
            this.previousNodeIsBR = false;
          } else
            if (node.nodeName == 'BR') {
              if (!this.previousNodeIsBR) {
                textNodes.push(node);
              }
              this.previousNodeIsBR = true;
            } else {
              this.previousNodeIsBR = false;
              textNodes.push(node);
            }
        }

      }

      this.previousNodeIsText = false;
      for (var i = 0, len = children.length; i < len; ++i) {
        textNodes.push.apply(textNodes, this.getTextNodesIn(children[i]));
      }
    }
    return textNodes;
  }

  trim(str) {
    return str.replace(/^\s+|\s+$/g, '');
  }

  removeNewLine(str) {
    return str.replace(/\n/g, '');
  }

  isSkipCountNode(str, foundText) {
    if ((str == 'p' && foundText) || (str == 'P' && foundText) || (str == 'TD') || (str == 'td') || (str == 'IMG') || (str == 'BR') || (str == 'br') || (str == 'LI') || (str == 'BLOCKQUOTE')) {
      return true;
    }
    return false;
  }

  checkIfIE(version = null, comparison = null) {

    var cc = 'IE',
      b = document.createElement('B'),
      docElem = document.documentElement,
      isIE;

    if (version) {
      cc += ' ' + version;
      if (comparison) { cc = comparison + ' ' + cc; }
    }

    b.innerHTML = '<!--[if ' + cc + ']><b id="iecctest"></b><![endif]-->';
    docElem.appendChild(b);
    isIE = !!document.getElementById('iecctest');
    docElem.removeChild(b);

    if (!isIE) {
      if (document.body.style.touchAction !== undefined)
        isIE = true;
    }
    return isIE;
  }

  //Clears mouse selection
  clearSelection() {
    if (window.getSelection) {
      if (window.getSelection().empty) {  // Chrome
        window.getSelection().empty();
      } else if (window.getSelection().removeAllRanges) {  // Firefox
        window.getSelection().removeAllRanges();
      }
    } else if ((document as any).selection) {  // IE?
      (document as any).selection.empty();
    }
  }

  clearHighlights() {
    $('h-tag').each(function (key, node) {

      var parentNode = node.parentNode;
      //  parentNode.appendChild(node.children);
      $(node).contents().unwrap();
      node.normalize();
      parentNode.normalize();
    });

    $('s-tag').each(function (key, node) {
      var parentNode = node.parentNode;
      $(node).contents().unwrap();
      node.normalize();
      parentNode.normalize();
    });
  }

  getParentNodeId(parentNodeId) {

    if (parentNodeId == 'questionText')
      return 0;
    if (parentNodeId == 'explanation')
      return -1;
    if (parentNodeId == 'questionAbstract')
      return -2;
    if (parentNodeId == 'answerChoicesDiv')
      return -3;
    if (parentNodeId == 'view-lecture-article')
      return -4;

    return 1;
  }

  getElementDiv(val) {

    if (val == '0')
      return 'questionText';
    if (val == '-1')
      return 'explanation';
    if (val == '-2')
      return 'questionAbstract';
    if (val == '-3')
      return 'answerChoicesDiv';
    if (val == '-4')
      return 'view-lecture-article';
  }

  //StrikeOuts code
  answerStrikeoutOnLoad(answerId) {

    var answerObj = document.getElementById(answerId);
    if (answerObj)
      this.strikeoutText(answerObj);

    var answerHighlightObj = document.getElementById('answerhighlight' + answerId);
    if (answerHighlightObj)
      this.strikeoutText(answerHighlightObj);
  }

  strikeoutText(spanObj) {

    if (spanObj !== null) {
      if (spanObj.innerHTML) {
        var text = spanObj.innerHTML;
        var strikeText = text.strike();
        //the below condition added as on initial load the option is added twice, Srikanth
        if (strikeText.indexOf('<script') > -1) {
          spanObj.innerHTML = strikeText.replace(/<script.*>([\s\S]*?)<\/script>/g, '');
        } else {
          spanObj.innerHTML = strikeText;
        }
      }
    }
  }

  unstrikeoutText(spanObj) {
    if (spanObj !== null) {
      var text = spanObj.innerHTML;

      var strikeStartTag = '<strike>';

      var strikeEndTag = '</strike>';

      var startIndex = text.indexOf(strikeStartTag);

      var endIndex = text.indexOf(strikeEndTag);

      spanObj.innerHTML = text.substring(startIndex + strikeStartTag.length, endIndex);
    }
  }


  getLastTextNodesBetween(selection) {
    var _range = selection.getRangeAt(0), rootNode = _range.commonAncestorContainer,
      _startNode = _range.startContainer, _endNode = selection.focusNode,
      _startOffset = _range.startOffset, _endOffset = selection.focusOffset,
      pastStartNode = false, reachedEndNode = false, textNodes = [], LastTextNode = null;
    function getTextNodesNew(node) {
      var val = node.nodeValue;
      if (node == _startNode && node == _endNode && node !== rootNode) {
        if (val) textNodes.push(val.substring(_startOffset, _endOffset));
        pastStartNode = reachedEndNode = true;
      } else if (node == _startNode) {
        if (val) textNodes.push(val.substring(_startOffset));
        pastStartNode = true;
      } else if (node == _endNode) {
        if (val) textNodes.push(val.substring(0, _endOffset));
        reachedEndNode = true;
      } else if (node.nodeType == 3) {
        if (val && pastStartNode && !reachedEndNode && !/^\s*$/.test(val)) {
          textNodes.push(val);
          LastTextNode = node;

        }
      }
      for (var i = 0, len = node.childNodes.length; !reachedEndNode && i < len; ++i) {
        getTextNodesNew(node.childNodes[i]);
      }
    }
    getTextNodesNew(rootNode);
    return LastTextNode;
  }


  getFirstTextNodesBetween(selection) {
    var _range = selection.getRangeAt(0), rootNode = _range.commonAncestorContainer,
      _startNode = _range.startContainer, _endNode = selection.focusNode,
      _startOffset = _range.startOffset, _endOffset = selection.focusOffset,
      pastStartNode = false, reachedEndNode = false, textNodes = [], firstTextNode = null, foundFirstTextNode = false;

    function getTextNodesNew(node) {

      var val = node.nodeValue;
      if (node == _startNode && node == _endNode && node !== rootNode) {

        if (val) textNodes.push(val.substring(_startOffset, _endOffset));
        pastStartNode = reachedEndNode = true;
      } else if (node == _startNode) {

        if (val) textNodes.push(val.substring(_startOffset));
        pastStartNode = true;
      } else if (node == _endNode) {

        if (val) textNodes.push(val.substring(0, _endOffset));
        reachedEndNode = true;
      } else if (node.nodeType == 3) {
        if (val && pastStartNode && !reachedEndNode && !foundFirstTextNode && !/^\s*$/.test(val)) {
          textNodes.push(val);
          firstTextNode = node;
          foundFirstTextNode = true;
        }
      }
      for (var i = 0, len = node.childNodes.length; !reachedEndNode && !foundFirstTextNode && i < len; ++i) {
        var someNode = node.childNodes[i];

        getTextNodesNew(node.childNodes[i]);

      }
    }
    getTextNodesNew(rootNode);
    return firstTextNode;
  }
}

