import { Injectable } from '@angular/core';
import { Subject, Subscription } from 'rxjs';
import { Highlight } from '../Highlight'
export interface HighlightInfo{
    id: number;
    elementDiv: string;
    start: number;
    end: number;
    currentState: SelectionState,
    highLightcolor:SelectionColor
}

export enum SelectionState {
    highlight= 'highlight',
    strikeout= 'strikeout',
    annotation= 'annotation'
}

export enum SelectionColor{
    Default="",
    First = "1",
    Second = "2",
    SelectedColor="99"
}

@Injectable({
    providedIn: 'root',
})
export class HighlightFactoryService {
    createHighlight(): HighlightServiceLike {
        return new HighlightService();
    }
}

export interface HighlightServiceLike {
    highlightObj,
    menuPosition

    _onHighlightClick
    highlightClickSubscription: Subscription;
    selectedAnnotationInfo: HighlightInfo;
    annotatingFirstTime: boolean;

    addHighlight(colorCode?);
    addAnnotation(colorCode?);
    handleHighlightClick(highlightId: number, event);
    showContextMenu(event);
    checkSelection();
    removeHighlight(highlightId: number);
    setMenuPositions(event);
    showAnnotatorDialog(highlightId: number)
    closeAnnotatorDialog(cancelled: boolean);
    getHighlightList(): HighlightInfo[];
    loadHighlightsFromCollection(savedCollection: HighlightInfo[]);
}

export class HighlightService implements HighlightServiceLike{
    highlightObj: Highlight;

    /**
     * menuPosition will properties for positioning menu near to selection
     */
    menuPosition = { top: '0px', left: '0px', right: '0px' };

    _onHighlightClick = new Subject<{ highlightId: number, event: any }>();
    highlightClickSubscription: Subscription;
    
    /**
     * Info of last highlighted object, used incase of annotation. For keeping text highlighted while user typing in textBox
     */
    selectedAnnotationInfo: HighlightInfo;

    /**
     * Indicates whether selected text/highlight is annotating for first time or not
     */
    annotatingFirstTime: boolean;

    constructor() {
        this.highlightObj = new Highlight('', this._onHighlightClick);
        this.highlightClickSubscription = this._onHighlightClick.subscribe(data => {
            if (data) {
                this.handleHighlightClick(data.highlightId, data.event);
            }
        });
    }

    /**
     * Applies highlight to the text selected and hides the context menu
     * @param colorCode ColorCode for highlight, this will be enum of SelectionColor
     */
    addHighlight(colorCode?: SelectionColor) {

        this.highlightObj.addHighlight(colorCode);
        document.getElementById('contextualMenuSelection').style.display = 'none'
    }

    /**
     * Applies highlight to the text selected and hides the context menu
     * @param colorCode ColorCode for highlight, this will be enum of SelectionColor
     */
    addAnnotation(colorCode?:SelectionColor) {

        this.highlightObj.addAnnotation(colorCode);
        document.getElementById('contextualMenuSelection').style.display = 'none'
    }

    /**
     * If it is highlight we can remove directly, if it is annotation we will show the annotationBox
     * @param highlightId Id of highlight on which user clicked
     */
    handleHighlightClick(highlightId:number, event) {
        this.removeHighlight(highlightId);
    };


    /**
     * shows the context menu near the cursor.
     * @param event mouseUp event of selection., used to get position of cursor to show menu near to cursor
     */
    showContextMenu(event){
        if (this.checkSelection()) {
            this.setMenuPositions(event);
            let elem = document.getElementById('contextualMenuSelection');
            elem.style.top = this.menuPosition.top;
            elem.style.left = this.menuPosition.left;
            elem.style.right = this.menuPosition.right;
            elem.style.display = 'block';
        }
    }

    /**
     * Checks whether user selected any text or not
     * @returns true if any text is selected
     */
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

    /**
     * Removes the highlight for selected highlight
     * @param highlightId id of Highlight to be removed
     */
    removeHighlight(highlightId:number) {
        console.log(highlightId)
        this.highlightObj.removeHighlight(highlightId);
    }

    /**
     * sets the properties required for positioning contextmenu
     * @param event mouseUp event
     */
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

    /**
     * Shows the annotator dialog near to selection.
     * @param addHighlight Adds the highlight(Blue background and white font color) to selected text if highlightId is 0.
     */
    showAnnotatorDialog(highlightId:number) {
        document.getElementById('contextualMenuSelection').style.display = 'none';
        //Gets the annotator dialog and positioning near to cursor.
        let aDialog = document.getElementById('annotatorDialog');

        aDialog.style.top = this.menuPosition.top;
        aDialog.style.left = this.menuPosition.left;
        aDialog.style.right = this.menuPosition.right;
        aDialog.style.display = 'block'

        //If user annotating for first time then we will add highlight to selected text
        //because when user typing in textbox the selection will be cleared
        
        if (highlightId==0) {
            this.highlightObj.addHighlight(SelectionColor.SelectedColor);
            var list = this.highlightObj.GetHighLightsList();

            //Getting latestHighlightInfo which have max id
            this.selectedAnnotationInfo = list.reduce((a, b) => a.id > b.id ? a : b);
            this.selectedAnnotationInfo = { ...this.selectedAnnotationInfo };
            this.annotatingFirstTime = true;
        }
        else {
            var list = this.highlightObj.GetHighLightsList();
            this.selectedAnnotationInfo = list.find(x => x.id == highlightId);
            this.annotatingFirstTime = false;
        }
    }

    /**
     * If user saved annotation for the firstTime then it will remove already highlighted text and adds highlight/annotation based on rubric.
     * @param cancelled indicates whether dialog closed by cancelling or not
     */
    closeAnnotatorDialog(cancelled: boolean) {
        document.getElementById('annotatorDialog').style.display = 'none'

        //If user opened the annotator dialog for the first time then annotatingFirstTime will be true
        if (this.annotatingFirstTime) {
            this.highlightObj.removeHighlight(this.selectedAnnotationInfo.id);
            //If user saved annotation, then we will readd highlight based on color/rubric
            if (!cancelled)
            {
                this.selectedAnnotationInfo.highLightcolor = SelectionColor.Default;
                this.highlightObj.processHighlights(this.selectedAnnotationInfo.id, this.selectedAnnotationInfo.elementDiv, this.selectedAnnotationInfo.start, this.selectedAnnotationInfo.end, this.highlightObj.highlightList, this.highlightObj.state.highlight, this.selectedAnnotationInfo.highLightcolor);
            }
        }
    }

    /**
     * Get the list of highlights that applied for the question
     * @returns collection of highlight info
     */
    getHighlightList() : HighlightInfo[]{
        return this.highlightObj.GetHighLightsList();
    }

    /**
     * Reloads the saved highlights on page load
     * @param savedCollection collection of highlight info saved in the database
     */
    loadHighlightsFromCollection(savedCollection:HighlightInfo[]) {
        this.highlightObj.LoadHighlightsFromCollection(savedCollection);
    }
}
