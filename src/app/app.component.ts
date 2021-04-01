import { AnnotatorComponent } from './annotator/annotator.component';
import { AfterViewInit, Component } from '@angular/core';
import { Highlight} from '../Highlight'
import { Subject, Subscription } from 'rxjs';
import { MatDialog } from '@angular/material/dialog';

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.scss']
})
export class AppComponent implements AfterViewInit {
  title = 'HighLight-POC';
  menuPosition = { top: '0px', left:'0px', right: '0px' };
  highlightObj: Highlight;
  annotatedCollection: Map<number, string> = new Map<number, string>();
  highlightOptions = [1, 2, 3, 4, 5];
  _onHighlightDeselect = new Subject<{ highlightId: number, event: any }>();
  highlightDeselectSubscription: Subscription;
  constructor(public dialog: MatDialog, ){
    this.highlightObj = new Highlight('Home', this._onHighlightDeselect);
    this.highlightObj.LoadHighlights('Home');
    this.highlightDeselectSubscription = this._onHighlightDeselect.subscribe(data => {
      console.log(data)
      if (data) {
        this.checkBeforeDeselect(data.highlightId, data.event);
      }
    });
    document.addEventListener('click', ($event) => { 
      if (!this.checkSelection()) {
      document.getElementById('contextualMenuSelection').style.display= 'none';}
    })
  }

  ngAfterViewInit(){

     this.highlightObj.LoadHighLightsForM();
  }

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

  closeAnnotatorDialog(cancelled:boolean) {
    document.getElementById('annotatorDialog').style.display = 'none'
    if (!cancelled) {
      //this.restoreSelection(this.saveSelection);
      this.highlightObj.addAnnotation(1);
    }
  }

  showAnnotatorDialog(highlightId?) {
    // var r = window.getSelection().getRangeAt(0).getBoundingClientRect();
    // var relative = (document.body.parentNode as any).getBoundingClientRect();
    // // console.log(r.bottom - relative.top) + 'px';//this will place ele below the selection
    // // console.log(-(r.right - relative.right) + 'px');
    // let top = r.bottom;
    //margin/padding between selection and dialog
    //top += 20;
    
    document.getElementById('contextualMenuSelection').style.display='none';
    let aDialog = document.getElementById('annotatorDialog');
    
    aDialog.style.top = this.menuPosition.top;
    aDialog.style.left = this.menuPosition.left;
    aDialog.style.right = this.menuPosition.right;
    aDialog.style.display = 'block'
    this.savedSelection = this.saveSelection();
  }

  checkBeforeDeselect(highlightId, event) {
    this.removeHighlight(highlightId);
  };

  removeHighlight (highlightId) {
    console.log(highlightId)
    this.highlightObj.removeHighlight(highlightId);
    // var article = this.lectureInfo.fileList.find(file => file.typeId === 5);
    // article.highlights = this.highlightObj.GetHighlightsString();
  }

  setMenuPositions(event) {
    this.menuPosition.top= (event.pageY + 10) + 'px';
    if ((document.body.parentNode as any).getBoundingClientRect().width - event.pageX < 400) {
      this.menuPosition.left = '';
      this.menuPosition.right = 50 + "px";
    } else {
      this.menuPosition.left = (event.pageX - 30) + 'px';
      this.menuPosition.right = '';
    }
  }
  
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

  addHighlight(colorCode?) {

    this.highlightObj.addHighlight(colorCode);
    document.getElementById('contextualMenuSelection').style.display= 'none'
    // let article = this.lectureInfo.fileList.find(function (file) { return file.typeId === 5; });
    // article.highlights = this.highlightObj.GetHighlightsString();
  }

  addAnnotation(colorCode?) {

    this.highlightObj.addAnnotation(colorCode);
    document.getElementById('contextualMenuSelection').style.display = 'none'
    // let article = this.lectureInfo.fileList.find(function (file) { return file.typeId === 5; });
    // article.highlights = this.highlightObj.GetHighlightsString();
  }

  clearHighlight(){
    // this.highlightObj.clearHighlights()
  }

  showContextMenu(event, type) {
    
  // cmSelectionProperties.top = '';
  // cmSelectionProperties.left = '';
  // cmSelectionProperties.right = '';
    //}
};

saveHighLights(){
 let hstr =  this.highlightObj.GetHighLightsList();
 let requestObj = temp;
 let i ;
 hstr.forEach((a,index)=>{
  requestObj.attributes[index].highlight.color = hstr[index].highlightcolor,
  requestObj.attributes[index].selectedTextPosition = hstr[index].startid + ',' + hstr[index].endid
 })
 console.log(requestObj)
}
}


let temp = {
  "testRecordId": 206629837,
  "Answer_Text":"",
  "attributes": [
    {
      "div_id": "505173",
      "selectedTextPosition": "643,663",
      "section": "question",
      "faculty_id":"121234",
      "user_type" :"Faculty/Student",
      "highlight": {
        "color": "#F89103"
      },
      "annotation": {
        
        "Rubric_Type":"Thesis | Evidence | Comments",
        "Text": "This is an annotation on paragraph 1 on question",
        "Title":"This the title"
        }
    },
    {
      "div_id": "505173",
      "selectedTextPosition": "643,663",
      "section": "question",
      "faculty_id":"121234",
      "user_type" :"Faculty/Student",
      "highlight": {
        "color": "#F89103"
      },
      "annotation": {
        
        "Rubric_Type":"Thesis | Evidence | Comments",
        "Text": "This is an annotation on paragraph 1 on question",
        "Title":"This the title"
        }
    },
    {
      "div_id": "505173",
      "selectedTextPosition": "643,663",
      "section": "question",
      "faculty_id":"121234",
      "user_type" :"Faculty/Student",
      "highlight": {
        "color": "#F89103"
      },
      "annotation": {
        
        "Rubric_Type":"Thesis | Evidence | Comments",
        "Text": "This is an annotation on paragraph 1 on question",
        "Title":"This the title"
        }
    },
    {
      "div_id": "505173",
      "selectedTextPosition": "643,663",
      "section": "question",
      "faculty_id":"121234",
      "user_type" :"Faculty/Student",
      "highlight": {
        "color": "#F89103"
      },
      "annotation": {
        
        "Rubric_Type":"Thesis | Evidence | Comments",
        "Text": "This is an annotation on paragraph 1 on question",
        "Title":"This the title"
        }
    },{
      "div_id": "505173",
      "selectedTextPosition": "643,663",
      "section": "question",
      "faculty_id":"121234",
      "user_type" :"Faculty/Student",
      "highlight": {
        "color": "#F89103"
      },
      "annotation": {
        
        "Rubric_Type":"Thesis | Evidence | Comments",
        "Text": "This is an annotation on paragraph 1 on question",
        "Title":"This the title"
        }
    }

],
  "grading":{
    "Rubrics":[{
        "Thesis":"1",
        "Evidence and Commentry":"4",
        "Sophistication":"1"
    }]
  },
  "Score":""
}
