import { Subject, Subscription } from 'rxjs';
import { Highlight } from '../Highlight'
export interface HighlightInfo{
    id: number;
    elementDiv: string;
    start: number;
    end: number;
    state: SelectionState,
    highLightcolor:SelectionColor
}

export enum SelectionState {
    highlight= 'highlight',
    strikeout= 'strikeout',
    annotation= 'annotation'
}

export enum SelectionColor{
    First = 1,
    Second = 2,
    Third = 3,
    DefaultSelectionColor=99
}

export class HighlightService {
    highlightObj: Highlight;
    menuPosition = { top: '0px', left: '0px', right: '0px' };

    _onHighlightDeselect = new Subject<{ highlightId: number, event: any }>();
    highlightDeselectSubscription: Subscription;
    lastHinfo: HighlightInfo;

    constructor() {
        this.highlightDeselectSubscription = this._onHighlightDeselect.subscribe(data => {
            console.log(data)
            if (data) {
                this.checkBeforeDeselect(data.highlightId, data.event);
            }
        });
    }

    loadHighLights(loadString: string) {
        this.highlightObj = new Highlight(loadString, this._onHighlightDeselect);
    }

    addHighlight(colorCode?) {

        this.highlightObj.addHighlight(colorCode);
        document.getElementById('contextualMenuSelection').style.display = 'none'
        // let article = this.lectureInfo.fileList.find(function (file) { return file.typeId === 5; });
        // article.highlights = this.highlightObj.GetHighlightsString();
    }

    addAnnotation(colorCode?) {

        this.highlightObj.addAnnotation(colorCode);
        document.getElementById('contextualMenuSelection').style.display = 'none'
        // let article = this.lectureInfo.fileList.find(function (file) { return file.typeId === 5; });
        // article.highlights = this.highlightObj.GetHighlightsString();
    }

    checkBeforeDeselect(highlightId:number, event) {
        this.removeHighlight(highlightId);
    };

    invokeHighlights(container, event): void {
        if (this.checkSelection()) {
            this.setMenuPositions(event);
            let elem = document.getElementById('contextualMenuSelection');
            elem.style.top = this.menuPosition.top;
            elem.style.left = this.menuPosition.left;
            elem.style.right = this.menuPosition.right;
            elem.style.display = 'block';
        }
    }

    checkSelection() {
        if (window.getSelection) {
            if (window.getSelection().toString() != '') {
                return true;
            } else {
                return false;
            }
        } else if ((document as any).selection) {
            if ((document as any).selection.createRange().text != '') {
                return true;
            } else {
                return false;
            }
        }
    }

    removeHighlight(highlightId:number) {
        console.log(highlightId)
        this.highlightObj.removeHighlight(highlightId);
        // var article = this.lectureInfo.fileList.find(file => file.typeId === 5);
        // article.highlights = this.highlightObj.GetHighlightsString();
    }

    setMenuPositions(event) {
        this.menuPosition.top = (event.pageY + 10) + 'px';
        if ((document.body.parentNode as any).getBoundingClientRect().width - event.pageX < 400) {
            this.menuPosition.left = '';
            this.menuPosition.right = 50 + "px";
        } else {
            this.menuPosition.left = (event.pageX - 30) + 'px';
            this.menuPosition.right = '';
        }
    }

    showAnnotatorDialog() {
        // var r = window.getSelection().getRangeAt(0).getBoundingClientRect();
        // var relative = (document.body.parentNode as any).getBoundingClientRect();
        // // console.log(r.bottom - relative.top) + 'px';//this will place ele below the selection
        // // console.log(-(r.right - relative.right) + 'px');
        // let top = r.bottom;
        //margin/padding between selection and dialog
        //top += 20;

        document.getElementById('contextualMenuSelection').style.display = 'none';
        let aDialog = document.getElementById('annotatorDialog');

        aDialog.style.top = this.menuPosition.top;
        aDialog.style.left = this.menuPosition.left;
        aDialog.style.right = this.menuPosition.right;
        aDialog.style.display = 'block'
        //this.savedSelection = this.saveSelection();

        this.highlightObj.addHighlight(99);
        var list = this.highlightObj.GetHighLightsList();
        //Getting latestHinfo which have max id
        this.lastHinfo = list.reduce((a, b) => a.id > b.id ? a : b);
        this.lastHinfo = { ...this.lastHinfo };
    }

    closeAnnotatorDialog(cancelled: boolean) {
        document.getElementById('annotatorDialog').style.display = 'none'
        this.highlightObj.removeHighlight(this.lastHinfo.id);
        if (!cancelled) {
            // this.highlightObj.Select('explanation', 3695, 4000, this.highlightObj.idx++, this.highlightObj.state.annotation, 0);
            // this.highlightObj.Select(this.lastH.elementDiv, this.lastH.start, this.lastH.end, this.lastH.id, this.highlightObj.state.highlight, 0);
            this.lastHinfo.highLightcolor = 0;
            this.highlightObj.highlightList.push(this.lastHinfo);
            this.highlightObj.select(this.lastHinfo.id, this.lastHinfo.elementDiv, this.lastHinfo.start, this.lastHinfo.end, this.highlightObj.state.highlight, this.lastHinfo.highLightcolor);
        }
    }

    getHighlightList() : HighlightInfo[]{
        return this.highlightObj.GetHighLightsList();
    }

    //Below Code is not in use. Kept for reference
    saveSelection() {
        if (window.getSelection) {
            let sel = window.getSelection();
            if (sel.getRangeAt && sel.rangeCount) {
                return sel.getRangeAt(0);
            }
        } else if ((document as any).selection && (document as any).selection.createRange) {
            return (document as any).selection.createRange();
        }
        return null;
    }

    restoreSelection(range) {
        if (range) {
            if (window.getSelection) {
                let sel = window.getSelection();
                sel.removeAllRanges();
                sel.addRange(range);
            } else if ((document as any).selection && range.select) {
                range.select();
            }
        }
    }

    savedSelection: Selection;
}
