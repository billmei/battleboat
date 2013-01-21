/*************************************

Battleship Game

Version 1.0

Created by Bill Mei

MIT License

Fork me on Github
http://github.com/kortaggio/Battleship

**************************************/

import java.util.Scanner;
import java.util.Random;



public class Battleship  {
    public final static int SIZE_OF_BOARD = 10;

    public static void main(String[] args) {
        Scanner keyboard = new Scanner(System.in);
        String[][] foo = initializeBoard(SIZE_OF_BOARD);
        printBoard(foo);
    }

    public static void printBoard(String[][] boardArg) {

        // Top border
        System.out.print("\n");
        for (int i = 0; i < (boardArg.length*2 + 3); i++) {
            System.out.print("*");
        }
        System.out.print("\n");

        // Board content
        for (int i = 0; i <boardArg.length; i++) {
            //Left border
            System.out.print("* ");

            // Actual cells
            for (int j = 0; j < boardArg[i].length; j++) {
                System.out.print(boardArg[i][j]+" ");
            }

            // Right border
            System.out.println("*");
        }

        // Bottom border
        for (int i = 0; i < (boardArg.length*2 + 3); i++) {
            System.out.print("*");
        }
        System.out.println("\n");
    }

    public static String[][] initializeBoard(int boardSize) {
    String[][] newBoard = new String[boardSize][boardSize];
        for (int i = 0; i < newBoard.length; i++) {
            for (int j = 0; j < newBoard[i].length; j++) {
                newBoard[i][j] = "O";
            }
        }
    Fleet player1 = new Fleet();

    placeShips(newBoard,player1);

    return newBoard;
    }

    public static void placeShips(String[][] boardArray, Fleet player) {
        // Heads
        boardArray[player.carrier.xHead][player.carrier.yHead] = "X";
        boardArray[player.destroyer.xHead][player.destroyer.yHead] = "X";
        boardArray[player.tanker.xHead][player.tanker.yHead] = "X";
        boardArray[player.cargo.xHead][player.cargo.yHead] = "X";
        boardArray[player.patrol.xHead][player.patrol.yHead] = "X";

        // Tails
        boardArray[player.carrier.xTail][player.carrier.yTail] = "T";
        boardArray[player.destroyer.xTail][player.destroyer.yTail] = "T";
        boardArray[player.tanker.xTail][player.tanker.yTail] = "T";
        boardArray[player.cargo.xTail][player.cargo.yTail] = "T";
        boardArray[player.patrol.xTail][player.patrol.yTail] = "T";
    }
}

class Fleet {

    Ship carrier;
    Ship destroyer;
    Ship tanker;
    Ship cargo;
    Ship patrol;

    Ship[] theShips = {carrier,destroyer,tanker,cargo,patrol};

    Fleet() {
        carrier = new Ship(genXposition(),genYposition(),5,genDirection());
        destroyer = new Ship(genXposition(),genYposition(),4,genDirection());
        tanker = new Ship(genXposition(),genYposition(),3,genDirection());
        cargo = new Ship(genXposition(),genYposition(),3,genDirection());
        patrol = new Ship(genXposition(),genYposition(),2,genDirection());
    }

    public Ship getShip(int shipNumber) {
        return theShips[shipNumber];
    }

    public int genXposition() {
        Random generator = new Random();
        return generator.nextInt(Battleship.SIZE_OF_BOARD);
    }

    public int genYposition() {
        Random generator = new Random();
        return generator.nextInt(Battleship.SIZE_OF_BOARD);
    }

    public int genDirection() {
        Random generator = new Random();
        return generator.nextInt(4);
    }
}

class Ship {
    int xHead;
    int yHead;
    int sizeOfShip;
    int direction;

    /* Directions
    ** Numbers rotate clockwise from top:
    ** 0 = facing up, 1 = facing right, 2 = facing down, 3 = facing left */

    Ship (int x_position, int y_position, int sizeOfShip, int direction) {
        xHead = x_position;
        yHead = y_position;
        sizeOfShip = sizeOfShip;
        direction = direction;
    }

    public int xTail = getXTail(direction);
    public int yTail = getYTail(direction);

    public int getXTail(int direction) {
        switch (direction) {
            case 0 : return xHead; break;
            case 1 : return xHead - sizeOfShip; break;
            case 2 : return xHead; break;
            case 3 : return xHead + sizeOfShip; break;
        }
    }

    public int getYTail(int direction){
        switch (direction) {
            case 0 : return yHead + sizeOfShip; break;
            case 1 : return yHead; break;
            case 2 : return yHead - sizeOfShip; break;
            case 3 : return yHead; break;
        }
    }
}