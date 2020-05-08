var myMap;

function initMap() {
    var uluru = {lat: 50.388715, lng: 30.495557};//начальная координата
    var element = document.getElementById('map');
    var spinerWrap = document.querySelector('.mk-spinner-wrap');//preloader icon

    var searchControl = document.querySelector('.search-control');


    var mapOptions = {
        center: uluru,
        zoom: 16,
        mapTypeControl: false,
        fullscreenControl: false,
        streetViewControl: false
    };

    //инициализация карты
    myMap = new google.maps.Map(element, mapOptions);

    //Поиск моей позиции
    if (navigator.geolocation) {

        navigator.geolocation.getCurrentPosition(function (position) {
            var pos = {
                lat: position.coords.latitude,
                lng: position.coords.longitude
            };

            addMarker({
                coordinates: pos,
                flag: true,
                title: 'Я тут',
                map: myMap,
                content: 'Я тут!!!!',
               // icon: 'icons/home.png'
            }, 'icons/home.png');

            myMap.setCenter(pos);
        });
    }
    //END Поиск моей позиции


    //API ключ NovaPoshta
    let apiKey = '912d257222b0cb87a01f72c6ccd05cf2';

    //Массив маркеров
    var markers = [];

    //Массив данных (получаем от сервера)
    var places = [];

    //Справочник городов
    var city = [];

    //Справочник Областей
    var areas = [];

    //Ответ сервера
    let dataResp;


    //Работа с фильтрами
    let selectWeight = document.querySelector('#weight');
    selectWeight.selectedIndex = -1;


    //Заполнем справочник городов
    getCityDataBase();


    //AJAX запрос
    //Запрос на получение  областей
    let areasObj = {
        "apiKey": apiKey,
        "modelName": "Address",
        "calledMethod": "getAreas",
        "methodProperties": {}
    };

    let xhr = new XMLHttpRequest();

    xhr.open('POST', 'https://api.novaposhta.ua/v2.0/json/');

    xhr.setRequestHeader('Content-type', 'application/json; charset = utf-8');

    //Отправка данных на сервер
    xhr.send(JSON.stringify(areasObj));


    //проверяем состояние запроса
    xhr.addEventListener('readystatechange', function () {
        if (xhr.readyState < 4) {

        } else if (xhr.readyState === 4 && xhr.status === 200) {

            spinerWrap.style.display = 'none';

            dataResp = JSON.parse(xhr.response);
            let obj = {};
            for (let i = 0; i < dataResp.data.length; i++) {

                //Формируем объект данных для области
                obj = {
                    area: dataResp.data[i].Description,
                    ref: dataResp.data[i].Ref
                };

                areas.push(obj);
            }



            //Создание списка областей
            let selectArea = document.createElement('select');
            selectArea.id = 'areas';


            for (let i = 0; i < areas.length; i++) {

                //Формируем список областей
                let opt = document.createElement('option');
                opt.value = areas[i].ref;
                opt.innerText = areas[i].area;
                selectArea.append(opt);
            }

            //Создаем выпадающий select
            createComponent(searchControl, selectArea, 'Выбор населенного пункта', 'Область');


            selectArea.selectedIndex = -1;

            //Создание списка городов Области
            let selectCity = document.createElement('select');
            selectCity.id = 'city';

            //document.body.append(selectCity);
            createComponent(searchControl, selectCity, '', 'Город', false);


            //Выбор области
            selectArea.addEventListener('change', () => {
                if (selectArea.selectedIndex !== -1) {
                    //console.log(selectArea.value);

                    //Очищаем данные селекта
                    clearOption(selectCity);

                    //формируем второй список с городами
                    for(let k = 0; k < city.length; k++) {
                        if(city[k].area === selectArea.value) {

                            let optCity = document.createElement('option');
                            optCity.value = city[k].city;
                            optCity.innerText = city[k].city;
                            selectCity.append(optCity);
                        }
                    }
                }
            });
            //END Выбор области

            //Обработка выбора города
            selectCity.addEventListener('change', function () {
                getCity(selectCity.value);
            });

        }else{
            console.log('Что то пошло не так');
        }
    });

    //END Запрос на получение  областей

    //получение данных о метках от сервера
    getCity();
    /*END API*/


    //Вывод маркеров на карту
    function showAllMarks() {
        for (let i = 0; i < places.length; i++) {
            addMarker(places[i]);
        }
    }

    //Удаление маркеров с карты (когда создаем свой собственный фильтр)
    function setMapOnAll() {
        for (let i = 0; i < markers.length; i++) {
            markers[i].setMap(null);
        }
    }

    // Removes the markers from the map, but keeps them in the array.
    function clearMarkers() {
        setMapOnAll(null);
    }

    //Запрос на получение данных о конкретном городе
    function getCity(params = "Кривий Ріг") {
        places = []; // обнуляем массив с местами
        //убираем все метки с карты
        clearMarkers();

        let cities = {
            "modelName": "AddressGeneral",
            "calledMethod": "getWarehouses",
            "methodProperties": {
                "CityName": params
            },
            "apiKey": apiKey
        };

        let xhr2 = new XMLHttpRequest();

        xhr2.open('POST', 'https://api.novaposhta.ua/v2.0/json/');

        xhr2.setRequestHeader('Content-type', 'application/json; charset = utf-8');

        //Отправка данных на сервер
        xhr2.send(JSON.stringify(cities));

        //проверяем состояние запроса
        xhr2.addEventListener('readystatechange', function () {
            if (xhr2.readyState < 4) {
                spinerWrap.style.display = 'block';
            } else if (xhr2.readyState === 4 && xhr2.status === 200) {

                //Задержка перед выгрузкой маркера
                setTimeout(() => {
                    spinerWrap.style.display = 'none';

                    dataResp= JSON.parse(xhr2.response);
                    let obj = {};
                    for (let i = 0; i < dataResp.data.length; i++) {

                        //Формируем объект данных для меток
                        obj = {
                            coordinates: {lat: Number(dataResp.data[i].Latitude), lng: Number(dataResp.data[i].Longitude)},
                            title: dataResp.data[i].Description,
                            map: myMap,
                            content: {
                                number: dataResp.data[i].Number,
                                district: dataResp.data[i].DistrictCode,
                                title: dataResp.data[i].Description,
                                address: dataResp.data[i].ShortAddress,
                                phone: dataResp.data[i].Phone,
                                city: dataResp.data[i].CityDescription,
                                area: dataResp.data[i].SettlementAreaDescription,
                                maxWeight: dataResp.data[i].PlaceMaxWeightAllowed,
                                posTerminal: dataResp.data[i].POSTerminal,
                                workHours: dataResp.data[i].Schedule
                            }

                        };

                        places.push(obj);
                    }

                    console.log(places);
                    //Вывод всех маркеров на карту
                    showAllMarks();

                }, 3000);

            } else {
                console.log('Что то пошло не так');
            }
        });


        /*ФИЛЬТР ПО МАКСИМАЛЬНОМУ ВЕСУ*/
        selectWeight.addEventListener('change', function () {
            //убираем активные маркеры
            setMapOnAll();

            let image;

            if(Number(selectWeight.value) === 1000) {
                image = 'icons/glob-icon.png';
            }else if(Number(selectWeight.value) === 30){
                image = 'icons/flag-icon.png';
            }

            let arr = places.filter(weight => weight.content.maxWeight === selectWeight.value);
            //console.log(arr);

            for (let i = 0; i < arr.length; i++) {
                addMarker(arr[i], image);
            }

        });
        /*END ФИЛЬТР ПО МАКСИМАЛЬНОМУ ВЕСУ*/

    }


    //Добавление маркеров на карту
    function addMarker(params, icon) {
        var marker = new google.maps.Marker({
            position: params.coordinates,
            title: params.title,
            map: params.map
        });

        markers.push(marker);

        //InfoWindow
       // var infoWindow = new google.maps.InfoWindow;

        var mapSection = document.querySelector('.maps');
        var infoBlock = document.createElement('div');

        var infoBlockClose = document.createElement('button');
        infoBlockClose.classList.add('info__close');
        infoBlockClose.innerHTML = '&raquo;';



        // Обработка закрытия инфоОкна
        infoBlockClose.addEventListener('click', function() {
            infoBlock.classList.remove('info__active')
        });

        infoBlock.classList.add('info');

        if (icon) {
            marker.setIcon(icon);
        }

        if (!params.flag) {

            //Встроенный функционал инфоБлока в googleMapsApi
            /*
            infoWindow.setContent(`<span>${params.content.district} ${params.content.number}</span>
            <h1>${params.content.title}</h1>
            <p>Область ${params.content.area}</p>
            <p>Адрес ${params.content.city} ${params.content.address}</p>
            <p>Контактный телефон ${params.content.phone}</p>
            <p>Максимальный вес ${params.content.maxWeight}</p>
            <p>Доступные услуги  <br> ${params.content.posTerminal}</p>
            <p>График работы ${params.content.workHours}</p>
            
`);
*/
            //Моя реализация инфоБлока
            infoBlock.innerHTML = `<span>${params.content.district} ${params.content.number}</span>
            <h1>${params.content.title}</h1>
            <p>Область ${params.content.area}</p>
            <p>Адрес ${params.content.city} ${params.content.address}</p>
            <p>Контактный телефон ${params.content.phone}</p>
            <p>Максимальный вес ${params.content.maxWeight}</p>
            <p>Доступные услуги  <br> ${params.content.posTerminal}</p>
            <p>График работы ${params.content.workHours}</p>
            
`;

        } else {
           // infoWindow.setContent(`<p>${params.content}</p>`);
            infoBlock.innerHTML = `<p>${params.content}</p>`;
        }

            marker.addListener('click', function () {
               //Удаляем все инфоБлоки
                hideAllInfoElement();

                infoBlock.classList.add('info__active');
                mapSection.append(infoBlock);
                infoBlock.append(infoBlockClose);
            });

        }

    //скрываем все инфо Окна
    function hideAllInfoWindows(info, map) {
        for(let i = 0; i < markers.length; i++) {
            info.close(map, markers[i]);
        }
    }

    //Запрос формирование справочника городов
    function getCityDataBase() {
        //Запрос на получение меток фильтр по городам

        let cityObj = {
            "modelName": "Address",
            "calledMethod": "getCities",
            "methodProperties": {},
            "apiKey": apiKey
        };


        let xhrCity = new XMLHttpRequest();

        xhrCity.open('POST', 'https://api.novaposhta.ua/v2.0/json/');

        xhrCity.setRequestHeader('Content-type', 'application/json; charset = utf-8');

        //Отправка данных на сервер
        xhrCity.send(JSON.stringify(cityObj));

        //проверяем состояние запроса
        xhrCity.addEventListener('readystatechange', function () {
            if (xhrCity.readyState < 4) {

            } else if (xhrCity.readyState === 4 && xhrCity.status === 200) {

                let obj = {};

                let cities = JSON.parse(xhrCity.response);

                for (let i = 0; i < cities.data.length; i++) {

                    obj = {
                        city: cities.data[i].Description,
                        area: cities.data[i].Area
                    };

                    //Сформировали справочник населенных пунктов
                    city.push(obj);
                }
            } else {
                console.log('Что то пошло не так');
            }

        });

    }

    //Создание labels
    function createLabel(elem, selectElement, text) {
        let label = document.createElement('label');
        label.setAttribute('for', selectElement.id);
        label.innerText = text;
        elem.append(label);
    }

    //Формирование списка
    function createComponent(parentElem, elem, legendText = '', labelText = 'Текст label', flag = true) {
        let fieldset = document.createElement('fieldset');
        let legend = document.createElement('legend');
        let formGroup = document.createElement('div');

        formGroup.classList.add('form-group');
        legend.innerText = legendText;

        fieldset.append(legend);
        fieldset.append(formGroup);

        createLabel(formGroup, elem, labelText);

        formGroup.append(elem);

        if (flag) {
            parentElem.append(fieldset);
        } else {
            //Добавляем группу в предыдущий fieldset в блоке
            parentElem.lastElementChild.appendChild(formGroup);
        }
    }

    //clearSelectOption
    function clearOption(select) {
        let length = select.options.length;
        for (let i = length - 1; i >= 0; i--) {
            select.options[i] = null;
        }

    }

    //скрываем все инфо Окна
    function hideAllInfoElement() {
        let mapSection = document.querySelector('.maps');
        let info = document.querySelectorAll('.info');

        for (let i = 0; i < info.length; i++) {
            info[i].remove();
        }

    }

}//конец функции карты

/*Navigation*/

let searchPanel = document.querySelector('.search-control');

let navBtn = document.querySelector('.nav__btn');
    navBtn.addEventListener('click', function() {
       this.classList.add('nav__btn_active');
        searchPanel.style.display = 'block';
    });

let searchClose = document.querySelector('.search-control__close');
searchClose.addEventListener('click', function() {
    searchPanel.style.display = 'none';
    navBtn.classList.remove('nav__btn_active');
});
/*End Navigation*/

