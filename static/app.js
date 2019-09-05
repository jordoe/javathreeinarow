$(document).ready(function() {
	
	var mensajesServer = document.getElementById('canvas3').getContext('2d');
	simbolo = 2;               //VARIABLE QUE DEFINE SI SE DIBUJARA UNA X (1) O UN CIRCULO (0)
	idRival = "null";          //la id del rival
	var enPartida = false;     //indica si se está actualmente en partida
	var meToca = false;
	
	var tablero = ["no","no","no","no","no","no","no","no","no"];
	
	var connection = new WebSocket('ws://127.0.0.1:8080/chat');
	connection.onerror = function(e) {
		console.log("WS error: " + e);
	}
	
	function apuntar(pos){
		switch (pos){
		
			case 11:
				tablero[0] = "si";
			break;
			case 12:
				tablero[1] = "si";
			break;
			case 13:
				tablero[2] = "si";
			break;
			case 21:
				tablero[3] = "si";
			break;
			case 22:
				tablero[4] = "si";
			break;
			case 23:
				tablero[5] = "si";
			break;
			case 31:
				tablero[6] = "si";
			break;
			case 32:
				tablero[7] = "si";
			break;
			case 33:
				tablero[8] = "si";
			break;		
		}
	}
	
	connection.onmessage = function(msg) {             //gestión de los mensajes recibidos por el server
		console.log("WS message: " + msg.data);
		var message = JSON.parse(msg.data);
		
		if (message.errorCreacion != null){     //en el caso de ser un mensaje de error de creacion
			mensajesServer.clearRect(0,0,350,300);     
			mensajesServer.font="18px Times New";    
			mensajesServer.strokeText(message.errorCreacion,90,30);
		}
		
		if (message.exitoCreacion != null){     //en el caso de ser un mensaje de exito al crear una sala
			mensajesServer.clearRect(0,0,350,300);     
			mensajesServer.font="18px Times New";    
			mensajesServer.strokeText(message.exitoCreacion,90,30);
			simbolo = 0;        //el creador de la sala siempre dibujará círculos
			meToca = true;  //como has creado la sala, empiezas jugando tu
		}
		
		if (message.exitoUnirse != null){     //en el caso de ser un mensaje de exito al unirse a una sala
			mensajesServer.clearRect(0,0,350,300);     
			mensajesServer.font="18px Times New";    
			mensajesServer.strokeText(message.exitoUnirse,90,30);
			simbolo = 1;        //el visitante de la sala siempre dibujará equis
			idRival = message.idRival;
			console.log(idRival);
			meToca = false;  //como te has unido a una sala, no empiezas jugando tu
		}
		
		if (message.exitoUnido != null){     //en el caso de ser un mensaje de exito al unirse a una sala
			mensajesServer.clearRect(0,0,350,300);     
			mensajesServer.font="18px Times New";    
			mensajesServer.strokeText(message.exitoUnido,90,30);
			idRival = message.idRival;
			console.log(idRival);
		}
		
		if (message.errorUnirse != null){     //en el caso de ser un mensaje de error al unirse a una sala
			mensajesServer.clearRect(0,0,350,300);     
			mensajesServer.font="18px Times New";    
			mensajesServer.strokeText(message.errorUnirse,90,30);
		}
		
		if (message.lleno != null){     //en el caso de que la sala esté llena
			mensajesServer.clearRect(0,0,350,300);     
			mensajesServer.font="18px Times New";    
			mensajesServer.strokeText(message.lleno,90,30);
		}
		
		if (message.salida != null){     //en el caso de ser un mensaje de salida del contrincante
			mensajesServer.clearRect(0,0,350,300);     
			mensajesServer.font="18px Times New";    
			mensajesServer.strokeText(message.salida,90,30);
			idRival = "null";                 //se borra el id del contricante
		}
		
		if (message.movimiento != null){     //en el caso de ser un mensaje de preguntar por un movimiento
			apuntar(message.movimiento);
			var x, y;
			x = casillaRatonX(message.movimiento);
			y = casillaRatonY(message.movimiento);
			dibujarSimbolo(x, y, simbolo);
			meToca = true;
		}
		
	}
	
	connection.onclose = function() {
		console.log("Closing socket");
	}
	
	$('#create-btn').click(function() {                   //Crear sala
		var msgCrear = {
			msgtype : "1",                                //es un mensaje de tipo 1, es decir, de crear sala
			name : $('#name').val(),
			room : $('#room').val()
		}
		connection.send(JSON.stringify(msgCrear));
	});
	
	$('#join-btn').click(function() {                   //Unirse a sala
		
		var salaLlena = false;
		
		var msgUnirse = {
			msgtype : "2",                                //es un mensaje de tipo 2, es decir, de unirse a sala
			name : $('#name').val(),
			room : $('#room').val()
		}
		connection.send(JSON.stringify(msgUnirse));
	});
	
	$('#exit-btn').click(function() {                   //Salir de una sala
		var msgSalir = {
			msgtype : "4",                                //es un mensaje de tipo 4, es decir, de salirse de una sala
			rivalId : idRival
		}
		connection.send(JSON.stringify(msgSalir));
		mensajesServer.clearRect(0,0,350,300);     
		mensajesServer.font="18px Times New";    
		mensajesServer.strokeText("Te has salido de la sala.",90,30);
		idRival = "null";               //se borra el id del contricante
	});
	
	
	
	
	
	
	var milienzo = document.getElementById('canvas1').getContext('2d');                 //se crea la variable milienzo con el lienzo
	var puntuaciones = document.getElementById('canvas2').getContext('2d');
	
	
	document.getElementById('canvas1').addEventListener("mousemove", controlRaton, true);   //evento que recive el movimiento del ratón
	document.getElementById('canvas1').addEventListener("click", controlRaton, true);     //evento que recive un click del ratón
	
	var texto = " "
	puntuaciones.clearRect(0,0,350,300);               /////////////////////////////////PROVISIONAL   ->>>> mostrar nombres de los jugadores top
	puntuaciones.font="18px Times New";               /////////////////////////////////
	puntuaciones.strokeText(texto,90,30);             /////////////////////////////////
	
	
	var anchoCanvas = 300;               //el ancho y el alto del canvas
	var altoCanvas = 300;
	var tamañoCelula = 100;               //el tamaño de cada casilla
	
	var posRatonX = 0;
	var posRatonY = 0;
	
	
			
	
	
	dibujaCuadricula(milienzo, tamañoCelula, anchoCanvas, altoCanvas);  //se dibuja la cuadrícula

	
	
	function dibujaCuadricula(contexto, tamañoCelula, anchoCanvas, altoCanvas){    //ésta función dibuja una cuadrícula en el canvas, mediante el trazado de líneas horizontales y verticales
	
	this.ancho = tamañoCelula;
	this.alto = tamañoCelula;
	
		for (var x=0; x<=anchoCanvas; x=x+ancho){
			contexto.beginPath();
			contexto.moveTo(x,0);
			contexto.lineTo(x,800);
			contexto.stroke();
		}
		
		for (var y=0; y<=altoCanvas; y=y+alto){
			contexto.beginPath();
			contexto.moveTo(0,y);
			contexto.lineTo(800,y);
			contexto.stroke();
		}
	}
	
	function ratonCasilla(x,y)         //esta función devuelve la casilla que ha sido pulsada
	{
		this.x = x;
		this.y = y;
		
		if (x>0 && x<100 && y>0 && y<100){ return 11;}      //casilla (1,1)
		if (x>0 && x<100 && y>100 && y<200){ return 12;}	//casilla (1,2)
		if (x>0 && x<100 && y>200 && y<300){ return 13;}    //casilla (1,3)
		if (x>100 && x<200 && y>0 && y<100){ return 21;}    //casilla (2,1)
		if (x>100 && x<200 && y>100 && y<200){ return 22;}	//casilla (2,2)
		if (x>100 && x<200 && y>200 && y<300){ return 23;}  //casilla (2,3)
		if (x>200 && x<300 && y>0 && y<100){ return 31;}    //casilla (3,1)
		if (x>200 && x<300 && y>100 && y<200){ return 32;}	//casilla (3,2)
		if (x>200 && x<300 && y>200 && y<300){ return 33;}  //casilla (3,3)
	}
	
	function casillaRatonX(casilla)
	{
		var x;
		var y;
		switch (casilla){
		
			case 11:
				x = 50; y = 50;
			break;
			case 12:
				x = 50; y = 150;
			break;
			case 13:
				x = 50; y = 250;
			break;
			case 21:
				x = 150; y = 50;
			break;
			case 22:
				x = 150; y = 150;
			break;
			case 23:
				x = 150; y = 250;
			break;
			case 31:
				x = 250; y = 50;
			break;
			case 32:
				x = 250; y = 150;
			break;
			case 33:
				x = 250; y = 250;
			break;		
		}
		return x;
	}
	function casillaRatonY(casilla)
	{
		var x;
		var y;
		switch (casilla){
		
			case 11:
				x = 50; y = 50;
			break;
			case 12:
				x = 50; y = 150;
			break;
			case 13:
				x = 50; y = 250;
			break;
			case 21:
				x = 150; y = 50;
			break;
			case 22:
				x = 150; y = 150;
			break;
			case 23:
				x = 150; y = 250;
			break;
			case 31:
				x = 250; y = 50;
			break;
			case 32:
				x = 250; y = 150;
			break;
			case 33:
				x = 250; y = 250;
			break;				
		}
		return y;
	}
	
	
	function controlRaton(e)        //esta función devuelve, mediante sus respectivas funciones internas, los valores x e y de la posición del ratón
	{
		var dimensionescanvas = this.getBoundingClientRect();
		var posRatonX = e.pageX - dimensionescanvas.left;
		var posRatonY = e.pageY - dimensionescanvas.top;
		
		switch (e.type)
		{			
			case "click":
				
				if(meToca){              //si me toca
					
					var micasilla = ratonCasilla(posRatonX,posRatonY);        //aqui se recoge la casilla pulsada
					                   
					var msgJuego = {
						msgtype : "3",                                //es un mensaje de tipo 3, es decir, de juego
						idRival : idRival,
						mov: micasilla
					}
					connection.send(JSON.stringify(msgJuego));
					
					dibujarSimbolo(posRatonX, posRatonY, simbolo);
					
					meToca = false;
				}
				console.log(posRatonX + ", " + posRatonY);				
		}		
	}
	
	
	function redondear(num)
	{
		if (num>0 && num<100){ num = 50; return num;}
		if (num>100 && num<200){ num = 150; return num;}
		if (num>200 && num<300){ num = 250; return num;}
	}
	
	function dibujarSimbolo(x, y, simbolo)        //esta función dibujará una ficha, en una posición determinada
	{
		this.x = x;
		this.y = y;

		var radio = 35;
			
		
		x = redondear(x);
		y = redondear(y);		
		
		
		if (simbolo == 0){          //dibujará un O
			var context = document.querySelector("#canvas1").getContext('2d');
			context.beginPath();
			context.strokeStyle="red";
			context.lineWidth = 2;
			context.arc(x, y, radio, 0, 2 * Math.PI, false);
			context.stroke();
			context.closePath();
		}
		
		if (simbolo == 1){          //dibujará una X
			var context = document.querySelector("#canvas1").getContext('2d');
			
		    context.moveTo(x-40,y-40);
		    context.lineTo(x+40,y+40);
		    context.strokeStyle="blue";
		    context.lineWidth = 2;
		    context.stroke();
		    
		    context.moveTo(x+40,y-40);
		    context.lineTo(x-40,y+40);
		    context.strokeStyle="blue";
		    context.lineWidth = 2;
		    context.stroke();
		}
	}

})