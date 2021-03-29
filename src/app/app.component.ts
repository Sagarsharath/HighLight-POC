import { AfterViewInit, Component } from '@angular/core';
import { Highlight} from '../Highlight'
import { Subject, Subscription } from 'rxjs';

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.scss']
})
export class AppComponent implements AfterViewInit {
  title = 'HighLight-POC';
  highlightObj: any;
  highlightOptions = [1, 2, 3, 4, 5];
  _onHighlightDeselect = new Subject<{ highlightId: number, event: any }>();
  highlightDeselectSubscription: Subscription;
  constructor(){
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

  checkBeforeDeselect(highlightId, event) {
    this.removeHighlight(highlightId);
  };

  removeHighlight (highlightId) {
    console.log(highlightId)
    this.highlightObj.removeHighlight(highlightId);
    // var article = this.lectureInfo.fileList.find(file => file.typeId === 5);
    // article.highlights = this.highlightObj.GetHighlightsString();
  }

  
  invokeHighlights(container, event): void {
    if (this.checkSelection()) {
      document.getElementById('contextualMenuSelection').style.display= 'block'
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

  clearHighlight(){
    // this.highlightObj.clearHighlights()
  }

  showContextMenu(event, type) {
    
  // cmSelectionProperties.top = '';
  // cmSelectionProperties.left = '';
  // cmSelectionProperties.right = '';
    //}
};
}
