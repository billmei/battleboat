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

    newBoard[player1.carrier.xHead][player1.carrier.yHead] = "X";
    newBoard[player1.destroyer.xHead][player1.destroyer.yHead] = "X";
    newBoard[player1.tanker.xHead][player1.tanker.yHead] = "X";
    newBoard[player1.cargo.xHead][player1.cargo.yHead] = "X";
    newBoard[player1.patrol.xHead][player1.patrol.yHead] = "X";

    return newBoard;
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
        carrier = new Ship(genXposition(),genYposition(),5);
        destroyer = new Ship(genXposition(),genYposition(),4);
        tanker = new Ship(genXposition(),genYposition(),3);
        cargo = new Ship(genXposition(),genYposition(),3);
        patrol = new Ship(genXposition(),genYposition(),2);
    }

    public Ship getShip(int shipNumber) {
        return theShips[shipNumber];
    }

    public int genXposition() {
        Random generator = new Random();
        String[] emptyArray = {};
        int thePosition = generator.nextInt(Battleship.SIZE_OF_BOARD);
        return thePosition;
    }

    public int genYposition() {
        Random generator = new Random();
        String[] emptyArray = {};
        int thePosition = generator.nextInt(Battleship.SIZE_OF_BOARD);
        return thePosition;
    }
}

class Ship {
    int xHead;
    int yHead;
    int sizeOfShip;

    Ship (int x_position, int y_position, int sizeOfShip) {
        xHead = x_position;
        yHead = y_position;
        sizeOfShip = sizeOfShip;
    }
    public int xTail = xHead + sizeOfShip;
    public int yTail = yHead + sizeOfShip;
}