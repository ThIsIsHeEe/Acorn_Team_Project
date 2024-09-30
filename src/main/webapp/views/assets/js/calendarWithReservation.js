/**
 * 캘린더와 예약현황 카드 연계 로직을 위한 클래스. 
 * 
 * 기능 및 작업들
 * 1. 사용자가 달력 내 특정 날짜 칸 클릭 시 예약현황 내용이 바뀌도록 우선 활성화된 
 * 모든 날짜 칸에 addeventListener("click", ...) 이벤트 부착. 
 * 2. 현재 사용자가 클릭한 날짜의 월, 연도 데이터를 추출하기 위해 해당 요소를 DOM으로 가져옴.
 * 이는 해당 날짜에 존재하는 모든 예약현황 데이터들을 DB로부터 가져오기 위함. 
 * 3. 예약현황 요소에 사용자가 달력에서 클릭한 칸에 해당하는 날짜와 그 날짜에 해당하는 
 * 데이터들을 집어넣을 수 있도록 예약현황 요소를 DOM으로 가져와 조작. 
 * 4. DB 데이터를 서버에 요청 시 페이지 깜빡임 현상을 없애기 위해 AJAX (fetch) 기술로 
 * 데이터를 가져오는 작업. 
 */
class CalendarAndReservation {
	
	ManipulateReservationTable = class {
		constructor(reservationTableElement) {
			this.reservationTableElement = reservationTableElement;
			this._initVarsForPaging();

			this.jsonToolObj;
		}

		setJsonToolObj(jsonToolObj) {
			this.jsonToolObj = jsonToolObj;
		}

		/**
		 * 페이징 기능을 위한 변수 초기화.
		 */
		_initVarsForPaging() {
			this.numRecordsPerPage = 1; // 한 페이지에 보여줄 데이터 개수. 이미 정해진 수

			this.currentPageNum = 1; // 현재 페이지 번호. 
			this.totalPages = 1;  // 전체 페이지 수. 
			this.startRecordNum = 1; // 한 페이지의 시작 번호. 
			this.endRecordNum = 1; // 한 페이지의 끝 번호. 
		}

		/**
		 * json 데이터를 받아 페이징 관련 변수들을 할당. 
		 */
		_setVarsForPaging() {
			this.currentPageNum = parseInt(this.reservationTableElement.getAttribute("nowPage"));
			this.totalPages = Math.ceil(this.jsonToolObj.getPropertyLength() / this.numRecordsPerPage);
			this.startRecordNum = 1 + (this.currentPageNum - 1) * this.numRecordsPerPage;
			this.endRecordNum = this.currentPageNum * this.numRecordsPerPage; 
		}
		
		/**
		 * 만약 선택된 날짜에 예약현황 데이터가 없을 경우 화면에 어떻게 표시할지를 결정하는 메서드.
		 */
		noReservationTableInnerHTML() {
			this.reservationTableElement.innerHTML = `
				<tr>
					<td class="text-bold-500" colspan="2">예약현황이 없습니다.</td>
				</tr>`;
		}
			
		/**
	     * 예약현황 데이터를 모두 없앤다. 
		 */
	    clearReservationTableInnerHTML() {
			this.reservationTableElement.innerHTML = `<tr></tr>`;
		}

		/**
		 * fetch로 받아온 데이터를 토대로 예약현황 카드 목록 구성.
		 */
		constructReservationTable() {
			let data = this.jsonToolObj.getJsonData();
			console.log('data: ');
			console.log(data);
			if (this.jsonToolObj.isEmptyJsonObj()) {
				// json 형태 객체 내부에 데이터가 없을 경우 처리 로직.
				this.noReservationTableInnerHTML();
				return;
			}

			this.clearReservationTableInnerHTML();

			this._setVarsForPaging();

			for (let i = this.startRecordNum; i <= this.endRecordNum; i++) {
				let tr = document.createElement("tr");
				for (let j = 0; j < data[i].length; j++) {
					let td = document.createElement("td");
					td.setAttribute("class", "text-bold-500");
					
					let textNode = document.createTextNode(data[i][j]);
					
					td.appendChild(textNode);
					tr.appendChild(td);
				}
				
				this.reservationTableElement.appendChild(tr);
			}

			this._constructPageVar();
		}

		/**
		 * 예약현황 목록 아래에 페이지 바를 만든다. 
		 * 
		 * 기본 코드 구조
		 * <tr>
				<td align="center" colspan="2" class="calendar-wrapper">
					<span id="prev" class="icons material-symbols-rounded" style="display: inline-block; transform: translateY(3px);">
						chevron_left
					</span>
					<i class="bi bi-dot"></i>  // 페이지 개수만큼!
					<span id="next" class="icons material-symbols-rounded " style="display: inline-block; transform: translateY(3px);">
						chevron_right
					</span>
				</td>
			</tr>
		 */
		_constructPageVar() {
			console.log("hi from _constructPageVar!!!");
			let tr = document.createElement("tr");

			function trEventHandler(event) {
				console.log("hi from _trEventHandler!!!");
				let trNowPageNum = parseInt(this.reservationTableElement.getAttribute("nowPage"));
				switch (event.target.tagName) {
					case "SPAN":
						const spanPrevNextId = event.target.getAttribute("id");
						if ((spanPrevNextId == "prev" && trNowPageNum <= 1) || (spanPrevNextId == "next" && trNowPageNum >= this.totalPages)) return;

						if (spanPrevNextId == "prev") {
							this.reservationTableElement.setAttribute("nowPage", `${trNowPageNum--}`);
						} else if (spanPrevNextId == "next") {
							this.reservationTableElement.setAttribute("nowPage", `${trNowPageNum++}`);
						}
						console.log("hi from span in _trEventHandler!!!");
						this.constructReservationTable();

						break;
					case "I":
						this.reservationTableElement.setAttribute("nowPage", event.target.getAttribute("pageNum"));
						break;
				}
			}

			tr.addEventListener("click", trEventHandler.bind(this));

			console.log("hi from _trEventHandler!!! 22");

			let td = document.createElement("td");
			td.setAttribute("align", "center");
			td.setAttribute("colspan", "2");
			td.classList.add("calendar-wrapper");

			const spanFactory = (text) => {
				let spanElement = document.createElement("span");
				spanElement.setAttribute("id", "prev");
				spanElement.classList.add("icons");
				spanElement.classList.add("material-symbols-rounded");
				spanElement.setAttribute("style", "display: inline-block; transform: translateY(3px);");
				//spanElement.style = "display: inline-block; transform: translateY(3px);";

				let textNode = document.createTextNode(text);
				spanElement.appendChild(textNode);

				return spanElement;
			};

			const spans = {
				"left": spanFactory("chevron_left"),
				"right": spanFactory("chevron_right")
			};

			// < ... > 요소 넣기
			td.appendChild(spans.left);
			
			for (let i = 0; i < this.totalPages; i++) {
				const iElement = document.createElement("i");
				// class="bi bi-dot"
				iElement.classList.add("bi");
				iElement.classList.add("bi-dot");
				iElement.setAttribute("pageNum", `${i+1}`);
				td.appendChild(iElement);
			}

			td.appendChild(spans.right);
			tr.appendChild(td);
			this.reservationTableElement.appendChild(tr);
		}
		
	}
	
	JsonObjTool = class {
		jsonData;
		
		/**
		 * json 형태 객체({}) 내부에 프로퍼티가 하나도 없는지 확인하는 메서드. 
	     * @returns - boolean.  객체 내 프로퍼티가 하나도 없으면 true, 하나라도 있으면 false
		 */
		isEmptyJsonObj() {
			return (Reflect.ownKeys(this.jsonData).length == 0) ? true : false;
		}
		
		/**
		 * json 객체 내 프로퍼티의 개수 반환. 
		 */
		getPropertyLength() {

			try {
				return Reflect.ownKeys(this.jsonData).length;
			} catch (TypeError) {
				return 0;
			}
		}
		
		/**
		 * fetch로 전송받은 json 형태 데이터를 저장. 
		 */
		setJsonData(jsonObj) {
			this.jsonData = jsonObj;
		}
		
		/**
		 * 이 객체에 설정한 fetch로 전송받은 json 형태 데이터를 반환.
		 */
		getJsonData() {
			return this.jsonData;
		}
	}
	
	constructor() {
		// 사용자가 선택한 달력 내 칸에 해당하는 연도, 월, 일.
		this.selectedYear, this.selectedMonth, this.selectedDayNum;
		// 사용자가 달력에서 선택한 칸에 해당하는 날짜를 yyyy-mm-dd 형태로 저장.
		this.selectedDate;
		
		this.monthTable = {
			"January": 1,
			"February": 2, 
			"March": 3, 
			"April": 4, 
			"May": 5, 
			"June": 6, 
			"July": 7,
			"August": 8, 
			"September": 9, 
			"October": 10, 
			"November": 11, 
			"December": 12
		};
		
		this.todayDateObj = new Date();
		this.todayDate = [
			this.todayDateObj.getFullYear(),
			this.todayDateObj.getMonth() + 1,
			this.todayDateObj.getDate()
		].join("-");
		
		this.jsonTool = new this.JsonObjTool();
		
		this._initElement();
		this._init();
		this._setEventHandlers();
	}
	
	/**
	 * 필요한 HTML 요소들을 가져와 초기화한다. 
	 */
	_initElement() {
		// 달력 오른쪽에 있는 "예약 현황" 카드 요소.
		this.currentReservation = document.querySelector("#current-reservation");
		
		// "예약 현황" 카드의 월, 연도 표시용 요소.
		[this.resDisplayMonth, this.resDisplayDate] = this.currentReservation
			.querySelectorAll("li:first-child span");
		
		// "예약 현황" 카드를 구성하는 table 요소
		this.reservationTable = this.currentReservation
			.querySelector("table[class='table table-bordered mb-0'");
		this.reservationTableTool = new this.ManipulateReservationTable(
			this.reservationTable
		);

		// 예약현황 <table> 요소에 현재 페이지 번호 정보 남김. 
		this.reservationTable.setAttribute("nowPage", "1");
		
		// 사용자가 보고 있는 달에 해당하는 달력 칸 요소들.
		this.activeCells = document.querySelectorAll(".days > li:not(.inactive)");
		this.calendarUl = document.querySelector(".days");
		
		// 처음 대시보드 페이지를 열었을 때 달력에 보이는 월, 연도 표시용 요소들을 가져옴.
		[this.selectedMonth, this.selectedYear] = document
			.querySelector(".current-date").textContent.split(" ");
	}
	
	/**
	 * 사용자가 처음 대시보드에 왔을 때 필요한 작업들을 처리. 
	 */
	_init() {
		this.resDisplayMonth.textContent = this.todayDateObj.getMonth() + 1;
		this.resDisplayDate.textContent = this.todayDateObj.getDate();
		this._fetchAndShowReservation();
	}
	
	_setEventHandlers() {
		this.calendarUl.addEventListener("click", event => {
			if (event.target.tagName !== "LI") return;
			
			// 사용자가 달력에서 선택한 칸에 해당하는 날짜 정보들을 취합.
			this.selectedDayNum = event.target.textContent;
			[this.selectedMonth, this.selectedYear] = document
				.querySelector(".current-date").textContent.split(" ");
			this.selectedMonth = this.monthTable[this.selectedMonth];
			
			// 사용자가 달력에서 선택한 날짜의 월, 연도를 "예약 현황" 카드에 표시. 
			this.resDisplayMonth.textContent = this.selectedMonth;
			this.resDisplayDate.textContent = this.selectedDayNum;
			
			// DB에 전송하기 위한 yyyy-mm-dd 형태의 문자열 데이터 구성. 
			this.selectedDate = [
				this.selectedYear, 
				this.selectedMonth, 
				this.selectedDayNum
			].join("-");
			
			this._fetchAndShowReservation();
		});
	}
	
	/**
	 * 사용자가 달력에서 선택한 칸에 해당하는 yyyy-mm-dd 형태의 날짜를 DB에 전송 후, 
	 * 그 날짜에 해당하는 예약 시간 및 예약 서비스명 데이터를 가져와 "예약현황" 카드 테이블에 
	 * 출력한다. 
	 */
	_fetchAndShowReservation() {
		let dateToInput = (this.selectedDate == undefined)? this.todayDate : this.selectedDate;
		 
		fetch(`/TeamProject/dashboard?command=CALENDAR_RESERVATION&date=${dateToInput}`)
			.then(response => response.json())
			.then(data => {
				/*
				this.reservationTableTool.clearReservationTableInnerHTML();

				this.jsonTool.setJsonData(data);

				// for Test
				//console.log(`data : `);
				//console.log(this._isEmptyJsonObj(data));
				
				// 가져온 데이터들을 토대로 목록 구성. 
				for (let key in data) {
					let tr = document.createElement("tr");
					for (let i = 0; i < 2; i++) {
						let td = document.createElement("td");
						td.setAttribute("class", "text-bold-500");
						
						let textNode = document.createTextNode(data[key][i]);
						
						td.appendChild(textNode);
						tr.appendChild(td);
					}
					
					this.reservationTable.appendChild(tr);
				}
				
				if (this.jsonTool.isEmptyJsonObj(data)) {
					// json 형태 객체 내부에 데이터가 없을 경우 처리 로직.
					this.reservationTableTool.noReservationTableInnerHTML();
				} else {
					this.reservationTable.insertAdjacentHTML("beforeend", 
						`<tr>
								<td align="center" colspan="2" class="calendar-wrapper">
								<a href="dashboard.jsp"><span id="prev" class="icons material-symbols-rounded" style="display: inline-block; transform: translateY(3px);">chevron_left</span></a>
								<i class="bi bi-dot"></i>
								<a href="dashboard.jsp"><span id="next" class="icons material-symbols-rounded " style="display: inline-block; transform: translateY(3px);">chevron_right</span></a>
								</td>
						</tr>`
					)
				}*/

				this.jsonTool.setJsonData(data);
				this.reservationTableTool.setJsonToolObj(this.jsonTool);
				this.reservationTableTool.constructReservationTable();
			});
	}
	
}
console.log("new hi21"); // For test

new CalendarAndReservation();

