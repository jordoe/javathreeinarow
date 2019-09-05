package es.jorge.juegosenred.tresraya;

import java.io.IOException;
import java.util.Map;
import java.util.concurrent.ConcurrentHashMap;

import org.springframework.web.socket.CloseStatus;
import org.springframework.web.socket.TextMessage;
import org.springframework.web.socket.WebSocketSession;
import org.springframework.web.socket.handler.TextWebSocketHandler;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.fasterxml.jackson.databind.node.ObjectNode;

public class Handler extends TextWebSocketHandler {

	private Map<String, WebSocketSession> sessions = new ConcurrentHashMap<>();
	private ObjectMapper mapper = new ObjectMapper();
	
	int maxSalas = 10;                                        //número máximo de salas
	String [] listaSalas = new String [maxSalas];             //string que guardará la lista de las salas
	String [] nombreSalas = new String [maxSalas];            //contiene tambien las salas existentes, pero sin el id del creador
	String [] capacidadSalas = {"vacio","vacio","vacio","vacio","vacio","vacio","vacio","vacio","vacio","vacio"};         //contiene si las salas están llenas o no
	
	String contrincante;      //en este string se guardará el id del contrincante, el cual se mantendrá una vez se haya entrado a una sala con otro jugador
	
	@Override
	public void afterConnectionEstablished(WebSocketSession session) throws Exception {
		System.out.println("New user: " + session.getId());
		sessions.put(session.getId(), session);
	}
	
	@Override
	public void afterConnectionClosed(WebSocketSession session, CloseStatus status) throws Exception {
		System.out.println("Session closed: " + session.getId());
		sessions.remove(session.getId());
	}
	
	@Override
	protected void handleTextMessage(WebSocketSession session, TextMessage message) throws Exception {
		
		System.out.println("Message received: " + message.getPayload());
		JsonNode node = mapper.readTree(message.getPayload());
		
		int tipoMensaje = node.get("msgtype").asInt();           //en esta variable se guarda el tipo de mensaje recibido por el servidor
		//System.out.println(tipoMensaje);
		
		switch (tipoMensaje) {
		 
        	case 1:                //tipo crear sala
	        
        		crearSala(session.getId(), node.get("name").asText(), node.get("room").asText(), session);
        		for (int i=0; i<maxSalas;i++){        
        			System.out.println(nombreSalas[i]);
        		}
        		

	        break;
 

	        case 2:                //tipo unirse a sala
	        
	        	unirseSala(session.getId(), node.get("name").asText(), node.get("room").asText(), session);
	        	for (int i=0; i<maxSalas;i++){        
        			System.out.println(capacidadSalas[i]);
        		}
	        	
	        break;


	        case 3:               //tipo juego (situar una ficha en el tablero)
	        
	        	gestionMovimientos(session.getId(), node.get("idRival").asText(), node.get("mov").asText(), session);

	        break;
	        
	        case 4:               //tipo salir de partida
	        	
	        	salirSala(node.get("rivalId").asText(), session);

		    break;

	 

	 }
		
		//sendOtherParticipants(session, node);
	} 

	private void sendOtherParticipants(WebSocketSession session, JsonNode node) throws IOException {

		System.out.println("Message sent: " + node.toString());
		
		ObjectNode newNode = mapper.createObjectNode();
		newNode.put("name", node.get("name").asText());
		newNode.put("message", node.get("message").asText());
		
		
		for(WebSocketSession participant : sessions.values()) {
			if(!participant.getId().equals(session.getId())) {
				participant.sendMessage(new TextMessage(newNode.toString()));
			}
		}
	}
	
	private void crearSala(String id, String nombre, String sala, WebSocketSession session) throws IOException{
		
		String comb = id + nombre + sala;            //en cada combinacion, se añade la id del hque creo la sala, y el nombre del mismo y de la sala
		String comb2 = nombre + sala;
		
		for (int i=0; i<maxSalas;i++){         //se recorre el array de la lista de salas, y donde esté vacía, se incluye la nueva sala
			if(comb2.equals(nombreSalas[i])){         //si la sala que se ha pedido crear ya existe, se manda un mensaje de vuelta diciendolo
				ObjectNode newNode = mapper.createObjectNode();
				newNode.put("errorCreacion", "La sala ya existe.");
				session.sendMessage(new TextMessage(newNode.toString()));
				break;
			}
			else if(listaSalas[i] == null){        //si hay hueco libre y la sala no existe
				listaSalas[i] = comb;
				nombreSalas[i] = comb2;
				ObjectNode newNode = mapper.createObjectNode();
				newNode.put("exitoCreacion", "Sala creada!");
				session.sendMessage(new TextMessage(newNode.toString()));
				i = maxSalas + 1;
			}
			
		}
		
	}
	
	private void unirseSala(String id, String nombre, String sala, WebSocketSession session) throws IOException{
		
		String comb = nombre + sala;
		
		for (int i=0; i<maxSalas;i++){         //se recorre el array de la lista de salas
			String suId = listaSalas[i].substring(0,1);        //se substrae el id del creador de la sala
			String lleno = capacidadSalas[i];
			
			if (comb.equals(nombreSalas[i]) && lleno.equals("llena")){                    //si está llena
				
				ObjectNode newNode3 = mapper.createObjectNode();
				newNode3.put("lleno", "Esta sala está llena.");
				session.sendMessage(new TextMessage(newNode3.toString()));
				break;
			}
			
			if(comb.equals(nombreSalas[i]) && !id.equals(suId) && !lleno.equals("llena")){         //si la sala que se ha pedido entrar existe, y tu no eres el creador de la misma, se manda un mensaje de vuelta diciendolo, asi como el id del creador y un mensaje al creador que contiene tu id
				
					ObjectNode newNode = mapper.createObjectNode();
					newNode.put("exitoUnirse", "Te has unido a la partida!");
					newNode.put("idRival", suId);
					session.sendMessage(new TextMessage(newNode.toString()));
					
					ObjectNode newNode2 = mapper.createObjectNode();
					newNode2.put("exitoUnido", "Se han unido a tu partida!");
					newNode2.put("idRival", session.getId());
					for(WebSocketSession participant : sessions.values()) {           //se manda un mensaje al creador de la sala con nuestro Id
						if(participant.getId().equals(suId)) {
							participant.sendMessage(new TextMessage(newNode2.toString()));
						}
					}
					
					capacidadSalas[i] = "llena";          //se marca la sala como llena
				
			break;
			}
			if(comb.equals(nombreSalas[i]) && id.equals(suId)){         //si la sala que se ha pedido entrar existe, y tu eres el creador de la misma, se manda un mensaje de vuelta diciendolo
				
				ObjectNode newNode = mapper.createObjectNode();
				newNode.put("errorUnirse", "No puedes unirte a tu propia sala!");
				session.sendMessage(new TextMessage(newNode.toString()));
				break;
			}else {        //si la sala no existe
				if (i == maxSalas-1){
					ObjectNode newNode = mapper.createObjectNode();
					newNode.put("errorUnirse", "La sala no existe.");
					session.sendMessage(new TextMessage(newNode.toString()));
					}
				  }				
			}
	}
	private void salirSala(String idRival, WebSocketSession session) throws IOException{           //manda un mensaje a tu rival avisándole de que has salido de su sala
		
		ObjectNode newNode = mapper.createObjectNode();
		newNode.put("salida", "El rival ha abandonado la sala :(");
		for(WebSocketSession participant : sessions.values()) {          
			if(participant.getId().equals(idRival)) {
				participant.sendMessage(new TextMessage(newNode.toString()));
			}
		}
		
		for (int i=0; i<maxSalas;i++){                              //Si el id del que salio de la sala es el mismo que el del que creo la sala, se borra la sala de la lista
			if(listaSalas[i] != null){
				if(listaSalas[i].substring(0,1).equals(session.getId())){
					listaSalas[i] = null;
					nombreSalas[i] = null;
					capacidadSalas[i] = "vacio";
				}
			}
		}
	}
	
	private void gestionMovimientos(String id, String idRival, String micasilla, WebSocketSession session) throws IOException{
		
		ObjectNode newNode = mapper.createObjectNode();
		newNode.put("movimiento", micasilla);
		for(WebSocketSession participant : sessions.values()) {                 //se le manda el movimiento al otro jugador    
			if(participant.getId().equals(idRival)) {
				participant.sendMessage(new TextMessage(newNode.toString()));
			}
		}
		
	}
}
