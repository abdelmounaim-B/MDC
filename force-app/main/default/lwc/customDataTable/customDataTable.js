// customDataTable.js
import LightningDatatable from "lightning/datatable";
import customPicklistTemplate from "./customPicklist.html";

export default class CustomDataTable extends LightningDatatable {
  static customTypes = {
    customPicklist: {
      template: customPicklistTemplate,
      //standardCellLayout: true,
      typeAttributes: ["options", "value", "recordId", "fieldName"]
    }
    
  };
}