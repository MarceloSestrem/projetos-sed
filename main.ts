//% color="#1C2833" weight=120 icon="\uf013" block="Super Kit Automação"
namespace superKitAutomacao {

    export enum LinhasLCD {
        //% block="Linha 1"
        Linha1 = 0,
        //% block="Linha 2"
        Linha2 = 1,
        //% block="Linha 3"
        Linha3 = 2,
        //% block="Linha 4"
        Linha4 = 3
    }

    export enum ModeloLCD {
        //% block="16x2"
        LCD16x2 = 16,
        //% block="20x4"
        LCD20x4 = 20
    }

    let lcdAddr = 0x27
    let oledAddr = 0x3C
    let rfidAddr = 0x24 // Endereço padrão I2C do PN532

    // =======================================================
    // 📺 MÓDULO 1: DISPLAYS AVANÇADOS (LCD I2C, OLED E NOKIA)
    // =======================================================

    /**
     * Inicializa o display LCD I2C (16x2 ou 20x4) usando o chip PCF8574.
     */
    //% blockId=superkit_init_lcd block="inicializar LCD I2C endereço %addr | modelo %modelo"
    //% addr.defl=0x27 weight=100 group="Displays"
    export function inicializarLCD(addr: number, modelo: ModeloLCD): void {
        lcdAddr = addr;
        enviarComandoLCD(0x33);
        enviarComandoLCD(0x32);
        enviarComandoLCD(0x28); // Modo 4-bits, 2 linhas
        enviarComandoLCD(0x0C); // Liga display, desliga cursor
        enviarComandoLCD(0x01); // Limpa a tela
        basic.pause(2);
    }

    /**
     * Escreve um texto formatado em uma coordenada exata do LCD.
     */
    //% blockId=superkit_print_lcd block="LCD mostrar texto %texto | na Coluna %coluna Linha %linha"
    //% coluna.min=0 coluna.max=19 weight=95 group="Displays"
    export function mostrarTextoLCD(texto: string, coluna: number, linha: LinhasLCD): void {
        let offsets = [0x00, 0x40, 0x14, 0x54];
        let ddrRamAddr = offsets[linha] + coluna;
        enviarComandoLCD(0x80 | ddrRamAddr);
        for (let i = 0; i < texto.length; i++) {
            enviarDadosLCD(texto.charCodeAt(i));
        }
    }

    function enviarComandoLCD(cmd: number): void {
        write4bitsLCD(cmd & 0xF0, 0);
        write4bitsLCD((cmd << 4) & 0xF0, 0);
    }

    function enviarDadosLCD(dado: number): void {
        write4bitsLCD(dado & 0xF0, 1);
        write4bitsLCD((dado << 4) & 0xF0, 1);
    }

    function write4bitsLCD(valor: number, rs: number): void {
        let backlight = 0x08; // Pino P3 do PCF8574 controla a luz de fundo
        let buffer = pins.createBuffer(1);
        buffer[0] = valor | rs | backlight;
        pins.i2cWriteBuffer(lcdAddr, buffer);

        // Pulso de Enable (Gera transição de clock para o display)
        buffer[0] |= 0x04; pins.i2cWriteBuffer(lcdAddr, buffer);
        control.waitMicros(1);
        buffer[0] &= ~0x04; pins.i2cWriteBuffer(lcdAddr, buffer);
        control.waitMicros(40);
    }

    /**
     * Inicializa o mini display gráfico OLED SSD1306 (128x64) via I2C.
     */
    //% blockId=superkit_init_oled block="inicializar Tela OLED I2C endereço %addr"
    //% addr.defl=0x3C weight=90 group="Displays"
    export function inicializarOLED(addr: number): void {
        oledAddr = addr;
        let cmds = [0xAE, 0xD5, 0x80, 0xA8, 0x3F, 0xD3, 0x00, 0x40, 0x8D, 0x14, 0x20, 0x00, 0xA1, 0xC8, 0xDA, 0x12, 0x81, 0xCF, 0xD9, 0xF1, 0xDB, 0x40, 0xA4, 0xA6, 0xAF];
        for (let c of cmds) {
            let buf = pins.createBuffer(2);
            buf[0] = 0x00; buf[1] = c;
            pins.i2cWriteBuffer(oledAddr, buf);
        }
    }

    /**
     * Inicializa a tela gráfica clássica LCD Nokia 5110 via protocolo síncrono SPI.
     */
    //% blockId=superkit_init_nokia block="inicializar Nokia 5110 | SCK=P13 MOSI=P15 DC=%dc CE=%ce RST=%rst"
    //% weight=80 group="Displays"
    export function inicializarNokia5110(dc: DigitalPin, ce: DigitalPin, rst: DigitalPin): void {
        pins.spiFrequency(4000000);
        pins.spiFormat(8, 0);
        pins.digitalWritePin(rst, 0); basic.pause(10); pins.digitalWritePin(rst, 1);

        pins.digitalWritePin(ce, 0); pins.digitalWritePin(dc, 0); // Modo Comando
        pins.spiWrite(0x21); // Ativa comandos estendidos
        pins.spiWrite(0xB1); // Ajuste de contraste interno (VOP)
        pins.spiWrite(0x13); // Modo de polarização (BIAS)
        pins.spiWrite(0x20); // Retorna a comandos normais
        pins.spiWrite(0x0C); // Configura exibição normal
        pins.digitalWritePin(ce, 1);
    }

    // =======================================================
    // 🎛️ MÓDULO 2: INTERFACES (KEYPAD 4x4 & PLACAS EXPANSORAS)
    // =======================================================

    /**
     * Varre a matriz de botões de um Keypad 4x4 e retorna a tecla pressionada.
     */
    //% blockId=superkit_read_keypad block="varrer Keypad 4x4 | Linhas[P0-P3] Colunas[P4-P7]"
    //% weight=100 group="Interfaces"
    export function lerKeypad4x4(): string {
        let teclas = ["1", "2", "3", "A", "4", "5", "6", "B", "7", "8", "9", "C", "*", "0", "#", "D"];
        let linhas = [DigitalPin.P0, DigitalPin.P1, DigitalPin.P2, DigitalPin.P3];
        let colunas = [DigitalPin.P4, DigitalPin.P5, DigitalPin.P6, DigitalPin.P7];

        for (let r = 0; r < 4; r++) {
            pins.digitalWritePin(linhas[r], 0);
            for (let c = 0; c < 4; c++) {
                if (pins.digitalReadPin(colunas[c]) == 0) {
                    pins.digitalWritePin(linhas[r], 1);
                    return teclas[r * 4 + c];
                }
            }
            pins.digitalWritePin(linhas[r], 1);
        }
        return "";
    }

    /**
     * Escreve uma máscara de bits diretamente em placas expansoras genéricas I2C PCF8574.
     */
    //% blockId=superkit_write_pcf8574 block="expansor PCF8574 endereço %addr | enviar byte %byteData"
    //% addr.defl=0x20 weight=90 group="Interfaces"
    export function writePCF8574(addr: number, byteData: number): void {
        let buf = pins.createBuffer(1);
        buf[0] = byteData;
        pins.i2cWriteBuffer(addr, buf);
    }

    // =======================================================
    // 🔑 MÓDULO 3: IDENTIFICAÇÃO AVANÇADA (RFID PN532)
    // =======================================================

    /**
     * Inicializa o chip RFID PN532 configurado em modo I2C.
     */
    //% blockId=superkit_init_rfid block="inicializar Leitor RFID PN532 via I2C"
    //% weight=100 group="RFID"
    export function inicializarPN532(): boolean {
        let buf = pins.createBuffer(7);
        buf[0] = 0x00; buf[1] = 0x00; buf[2] = 0xFF; // Preâmbulo de sincronismo
        buf[3] = 0x03; buf[4] = 0xFC; // Tamanho do pacote
        buf[5] = 0xD4; buf[6] = 0x14; // Comando: SAMConfiguration (Modo Virtual Normal)
        pins.i2cWriteBuffer(rfidAddr, buf);
        return true;
    }

    /**
     * Aguarda e extrai o código UID único de um cartão ou chaveiro NFC/RFID aproximado.
     */
    //% blockId=superkit_read_rfid_uid block="ler UID da tag RFID presente"
    //% weight=90 group="RFID"
    export function lerTagUID(): string {
        let cmd = pins.createBuffer(9);
        cmd[0] = 0x00; cmd[1] = 0x00; cmd[2] = 0xFF;
        cmd[3] = 0x04; cmd[4] = 0xFC; cmd[5] = 0xD4;
        cmd[6] = 0x4A; cmd[7] = 0x01; cmd[8] = 0x00; // Comando: InListPassiveTarget
        pins.i2cWriteBuffer(rfidAddr, cmd);

        basic.pause(30); // Tempo necessário para indução da antena

        let response = pins.i2cReadBuffer(rfidAddr, 20);
        if (response[7] == 0x4B) { // Verifica se o chip respondeu com sucesso
            let uid = "";
            let numBytes = response[12];
            for (let i = 0; i < numBytes; i++) {
                uid += response[13 + i].toString();
            }
            return uid;
        }
        return "";
    }
}
