import { HighlightFactoryService, HighlightService, SelectionColor } from './HighlightService'
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
  highlightService: HighlightService;
  selectionColorType: typeof SelectionColor = SelectionColor;
  
  constructor(public dialog: MatDialog, highlightFactory:HighlightFactoryService) {
    this.highlightService = highlightFactory.createHighlight();
    document.addEventListener('click', ($event) => { 
      if (!this.highlightService.checkSelection()) {
      document.getElementById('contextualMenuSelection').style.display= 'none';}
    })
  }

  ngAfterViewInit(){
    console.log(JSON.parse(localStorage.getItem("highlights")));
    this.highlightService.loadHighlightsFromCollection(JSON.parse(localStorage.getItem("highlights")));
    //  this.highlightService.highlightObj.LoadHighLightsForM();
  }
  
  clearHighlight(){
    // this.highlightObj.clearHighlights()
  }

  // showContextMenu(event, type) {

  //   cmSelectionProperties.top = '';
  //   cmSelectionProperties.left = '';
  //   cmSelectionProperties.right = '';
  // };

  saveHighLights() {
    // console.log(this.highlightService.getHighlightList());
    localStorage.setItem("highlights", JSON.stringify(this.highlightService.getHighlightList()));
    // let hstr = this.highlightService.highlightObj.GetHighLightsList();
    // console.log(hstr);
    // let requestObj = temp;
    // hstr.forEach((a, index) => {
    //   requestObj.attributes[index].highlight.color = hstr[index].highlightcolor,
    //     requestObj.attributes[index].selectedTextPosition = hstr[index].startid + ',' + hstr[index].endid
    // })
    // console.log(requestObj);
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
        "color": 0
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
        "color": 1
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
