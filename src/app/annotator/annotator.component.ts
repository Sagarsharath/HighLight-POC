import { Component, OnInit } from '@angular/core';
import { MatDialogRef } from '@angular/material/dialog';

@Component({
  selector: 'app-annotator',
  templateUrl: './annotator.component.html',
  styleUrls: ['./annotator.component.scss']
})
export class AnnotatorComponent implements OnInit {

  constructor(private matDialogRef: MatDialogRef<AnnotatorComponent>, ) { }

  ngOnInit() {
  }

  closeDialog(saved:boolean) {
    this.matDialogRef.close(saved);
  }

}
