import { Widget } from "@phosphor/widgets";

import { Run, ChangeType, CellRunData } from "../model/run";

import { HistoryModel } from "../model/history";

import { RunItem } from "./run-item";

import { DotMap } from "./dot-map";

import { VerdantListItem } from "./run-panel";

const RUN_ITEM_ACTIVE = "jp-mod-active";
const RUN_ITEM_CLASS = "v-VerdantPanel-runItem";
const RUN_ITEM_CARET = "v-VerdantPanel-runItem-caret";
const RUN_ITEM_NUMBER = "v-VerdantPanel-runItem-number";
const RUN_ITEM_TIME = "v-VerdantPanel-runItem-time";
const RUN_ITEM_TITLE_WRAPPER = "v-VerdantPanel-runItem-title-container";

const SUB_RUNLIST_CLASS = "v-VerdantPanel-runCluster-list";

export class RunCluster extends Widget implements VerdantListItem {
  historyModel: HistoryModel;
  runs: RunItem[];
  header: HTMLElement;
  dotMap: DotMap;
  clusterEvent: (item: RunItem) => void;

  constructor(
    historyModel: HistoryModel,
    runs: RunItem[],
    runEvents: (item: RunItem) => void
  ) {
    super();
    this.historyModel = historyModel;
    this.runs = runs || [];
    this.clusterEvent = runEvents;

    this.runs.map(item => {
      item.cluster = this;
    });

    this.header = this.buildHeader(runs);
    this.header.classList.add(RUN_ITEM_CLASS);
    this.header.classList.add("cluster");

    this.node.appendChild(this.header);
  }

  buildHeader(runs: RunItem[]): HTMLElement {
    let caret = document.createElement("div");
    caret.classList.add(RUN_ITEM_CARET);
    caret.classList.add("cluster");

    let number = document.createElement("div");
    number.textContent = "(" + runs.length + ")";
    number.classList.add(RUN_ITEM_NUMBER);

    let time = document.createElement("div");
    if (
      runs.length > 1 &&
      !Run.sameMinute(
        new Date(this.runs[0].run.timestamp),
        new Date(this.runs[this.runs.length - 1].run.timestamp)
      )
    ) {
      time.textContent =
        Run.formatTime(new Date(this.runs[0].run.timestamp)) +
        "-" +
        Run.formatTime(new Date(this.runs[this.runs.length - 1].run.timestamp));
    } else
      time.textContent = Run.formatTime(new Date(this.runs[0].run.timestamp));
    time.classList.add(RUN_ITEM_TIME);

    this.dotMap = this.buildDotMap();

    let header = document.createElement("div");
    let titleWrapper = document.createElement("div");
    titleWrapper.classList.add(RUN_ITEM_TITLE_WRAPPER);
    titleWrapper.appendChild(caret);
    titleWrapper.appendChild(number);
    titleWrapper.appendChild(time);
    header.appendChild(titleWrapper);
    header.appendChild(this.dotMap.node);
    return header;
  }

  buildDotMap(): DotMap {
    var runMap: CellRunData[] = [];
    this.runs.map(runItem => {
      runItem.run.cells.forEach((cell, index) => {
        var change: CellRunData = {
          node: "",
          changeType: ChangeType.SAME,
          run: false
        };
        if (runMap[index]) change = runMap[index];
        runMap[index] = {
          node: cell.node,
          changeType: Math.min(
            ChangeType.CHANGED,
            change.changeType + cell.changeType
          ),
          run: (change.run as boolean) || cell.run
        };
      });
    });

    let dotMap = new DotMap(this.historyModel, runMap);
    return dotMap;
  }

  get caret() {
    return this.header.getElementsByClassName(RUN_ITEM_CARET)[0];
  }

  blur() {
    this.node.classList.remove(RUN_ITEM_ACTIVE);
    this.caret.classList.remove("highlight");
  }

  nodeClicked(): RunItem {
    return null;
  }

  animLoading(): RunItem {
    return null;
  }

  caretClicked() {
    console.log("Caret of CLUSTER was clicked!");
    var caret = this.caret;
    if (caret.classList.contains("open")) {
      this.removeClass("open");
      //this.header.style.display = "";
      caret.classList.remove("open");
      this.runs.map(runItem => runItem.closeHeader());
      this.node.removeChild(
        this.node.getElementsByClassName(SUB_RUNLIST_CLASS)[0]
      );
    } else {
      caret.classList.add("open");
      this.addClass("open");
      //this.header.style.display = "none";
      let kidList = document.createElement("ul");
      kidList.classList.add(SUB_RUNLIST_CLASS);
      for (var i = this.runs.length - 1; i > -1; i--) {
        kidList.appendChild(this.runs[i].node);
        this.runs[i].caretClicked();
      }
      this.node.appendChild(kidList);
    }
  }
}

export namespace RunCluster {
  export function shouldCluster(run: Run, prior: Widget): boolean {
    if (run.star > -1 || run.note > -1) return false;
    var priorRun;
    if (prior instanceof RunItem) {
      priorRun = prior.run;
    } else if (prior instanceof RunCluster) {
      priorRun = prior.runs[0].run;
    } else return false;

    if (priorRun.star > -1 || priorRun.note > -1) return false;

    return (
      Run.sameDay(new Date(run.timestamp), new Date(priorRun.timestamp)) &&
      !run.hasEdits() &&
      !priorRun.hasEdits()
    );
  }
}
