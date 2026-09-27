//% color="#1C2833" weight=120 icon="\uf013" block="Super Kit Automação"
namespace superKitAutomacao {

    export enum EstadoLinha {
        //% block="Branco"
        Branco = 0,
        //% block="Preto"
        Preto = 1
    }

    export enum DistanciaUnidade {
        //% block="cm"
        Centimetros = 0,
        //% block="polegadas"
        Polegadas = 1
    }

    export enum MotorSelecao {
        //% block="M1A"
        M1A = 1,
        //% block="M1B"
        M1B = 2,
        //% block="M2A"
        M2A = 3,
        //% block="M2B"
        M2B = 4
    }

    export enum ServoPorta {
        //% block="S1"
        S1 = 1,
        //% block="S2"
        S2 = 2,
        //% block="S3"
        S3 = 3,
        //% block="S4"
        S4 = 4
    }

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

    const PCA9685_ADDRESS = 0x40
    const MODE1 = 0x00
    const PRESCALE = 0xFE
    const LED0_ON_L = 0x06

    let pcaInicializado = false
    let lcdAddr = 0x27
    let oledAddr = 0x3C
    let rfidAddr = 0x24
    let keypadI2cAddr = 0x20

    // =======================================================
    // 🤖 MÓDULO 1: ROBÓTICA E SEGUIDOR (ROBOTBIT & SENSORES)
    // =======================================================

    function initPCA9685(): void {
        if (pcaInicializado) return;
        let buf = pins.createBuffer(2);
        buf.setNumber(NumberFormat.UInt8LE, 0, MODE1);
        buf.setNumber(NumberFormat.UInt8LE, 1, 0x10);
        pins.i2cWriteBuffer(PCA9685_ADDRESS, buf);

        buf.setNumber(NumberFormat.UInt8LE, 0, PRESCALE);
        buf.setNumber(NumberFormat.UInt8LE, 1, 132);
        pins.i2cWriteBuffer(PCA9685_ADDRESS, buf);

        buf.setNumber(NumberFormat.UInt8LE, 0, MODE1);
        buf.setNumber(NumberFormat.UInt8LE, 1, 0x81);
        pins.i2cWriteBuffer(PCA9685_ADDRESS, buf);
        pcaInicializado = true;
    }

    function writePWM(canal: number, valor: number): void {
        initPCA9685();
        let buf = pins.createBuffer(5);
        buf.setNumber(NumberFormat.UInt8LE, 0, LED0_ON_L + (canal * 4));
        buf.setNumber(NumberFormat.UInt8LE, 1, 0);
        buf.setNumber(NumberFormat.UInt8LE, 2, 0);
        buf.setNumber(NumberFormat.UInt8LE, 3, valor & 0xFF);
        buf.setNumber(NumberFormat.UInt8LE, 4, (valor >> 8) & 0xFF);
        pins.i2cWriteBuffer(PCA9685_ADDRESS, buf);
    }

    /**
     * Controla a velocidade e direção dos motores DC (M1A a M2B) na Robotbit.
     */
    //% blockId=robotbit_controlar_motor block="mover motor %motor | velocidade %velocidade"
    //% velocidade.min=-255 velocidade.max=255
    //% weight=100 group="Robótica"
    export function controlarMotor(motor: MotorSelecao, velocidade: number): void {
        let canalM1 = 0; let canalM2 = 0;
        // P8 mudou para P1 para liberar o pino para o Keypad 4x4
        if (motor == MotorSelecao.M1A) { canalM1 = 2; canalM2 = 3; }
        else if (motor == MotorSelecao.M1B) { canalM1 = 4; canalM2 = 5; }
        else if (motor == MotorSelecao.M2A) { canalM1 = 6; canalM2 = 7; }
        else if (motor == MotorSelecao.M2B) { canalM1 = 8; canalM2 = 9; }

        let pinoDir = (motor == MotorSelecao.M1A) ? DigitalPin.P1 : (motor == MotorSelecao.M1B ? DigitalPin.P11 : (motor == MotorSelecao.M2A ? DigitalPin.P14 : DigitalPin.P15));

        // Como P14 e P15 também são colunas do Keypad, se o projeto usar motores M2A/M2B ao mesmo tempo que o teclado direto, 
        // o ideal é focar nos motores M1A/M1B ou usar o Keypad via módulo I2C para evitar qualquer sobreposição.
        pins.digitalWritePin(pinoDir, velocidade >= 0 ? 0 : 1);

        let velMapeada = Math.map(Math.abs(velocidade), 0, 255, 0, 4095);
        writePWM(canalM1, velMapeada);
        writePWM(canalM2, 0);
    }

    /**
     * Desliga e freia imediatamente TODOS os motores DC conectados.
     */
    //% blockId=robotbit_parar_todos_motores block="parar todos os motores"
    //% weight=95 group="Robótica"
    export function pararTodosOsMotores(): void {
        controlarMotor(MotorSelecao.M1A, 0); controlarMotor(MotorSelecao.M1B, 0);
        controlarMotor(MotorSelecao.M2A, 0); controlarMotor(MotorSelecao.M2B, 0);
    }

    /**
     * Controla o ângulo de um Servo Motor nas portas S1 a S4 da Robotbit.
     */
    //% blockId=robotbit_controlar_servo block="definir servo na porta %porta | para ângulo %angulo °"
    //% angulo.min=0 angulo.max=180
    //% weight=90 group="Robótica"
    export function controlarServo(porta: ServoPorta, angulo: number): void {
        let canalChip = 7 + porta;
        let pulso = Math.map(angulo, 0, 180, 150, 500);
        writePWM(canalChip, pulso);
    }

    /**
     * Verifica o estado dos 3 sensores de linha conectados rigidamente em P0, P1 e P2.
     */
    //% blockId=robotbit_ler_tres_sensores block="sensores Esquerdo (P0) Centro (P1) Direito (P2) leem respectivamente %estEsq %estCent %estDir"
    //% weight=85 group="Robótica" inlineInputMode=inline
    export function lerTresSensores(estEsq: EstadoLinha, estCent: EstadoLinha, estDir: EstadoLinha): boolean {
        let valEsq = pins.digitalReadPin(DigitalPin.P0);
        let valCent = pins.digitalReadPin(DigitalPin.P1);
        let valDir = pins.digitalReadPin(DigitalPin.P2);
        return (valEsq == estEsq && valCent == estCent && valDir == estDir);
    }

    /**
     * Mede a distância usando um sensor ultrassônico HC-SR04.
     */
    //% blockId=robotbit_ultrassonico_distancia block="distância ultrassônico Trig %trig | Echo %echo em %unidade"
    //% weight=80 group="Robótica"
    export function lerUltrassonico(trig: DigitalPin, echo: DigitalPin, unidade: DistanciaUnidade): number {
        pins.digitalWritePin(trig, 0); control.waitMicros(2);
        pins.digitalWritePin(trig, 1); control.waitMicros(10);
        pins.digitalWritePin(trig, 0);

        let duracao = pins.pulseIn(echo, PulseValue.High, 25000);
        if (duracao == 0) return 0;

        if (unidade == DistanciaUnidade.Centimetros) {
            return Math.round(duracao / 58);
        } else {
            return Math.round(duracao / 148);
        }
    }

    // =======================================================
    // 📺 MÓDULO 2: DISPLAYS (LCD I2C, OLED E NOKIA 5110)
    // =======================================================

    /**
     * Inicializa o display LCD I2C (16x2 ou 20x4) usando expansor PCF8574.
     */
    //% blockId=superkit_init_lcd block="inicializar LCD I2C endereço %addr | modelo %modelo"
    //% addr.defl=0x27 weight=100 group="Displays"
    export function inicializarLCD(addr: number, modelo: ModeloLCD): void {
        lcdAddr = addr;
        enviarComandoLCD(0x33); enviarComandoLCD(0x32);
        enviarComandoLCD(0x28); enviarComandoLCD(0x0C); enviarComandoLCD(0x01);
        basic.pause(2);
    }

    /**
     * Escreve um texto formatado em uma coordenada exata do LCD.
     */
    //% blockId=superkit_print_lcd block="LCD mostrar texto %texto | na Coluna %coluna Linha %linha"
    //% coluna.min=0 coluna.max=19 weight=95 group="Displays"
    export function mostrarTextoLCD(texto: string, coluna: number, linha: LinhasLCD): void {
        let offsets = [0x00, 0x40, 0x14, 0x54];
        enviarComandoLCD(0x80 | (offsets[linha] + coluna));
        for (let i = 0; i < texto.length; i++) {
            enviarDadosLCD(texto.charCodeAt(i));
        }
    }

    function enviarComandoLCD(cmd: number): void {
        write4bitsLCD(cmd & 0xF0, 0); write4bitsLCD((cmd << 4) & 0xF0, 0);
    }

    function enviarDadosLCD(dado: number): void {
        write4bitsLCD(dado & 0xF0, 1); write4bitsLCD((dado << 4) & 0xF0, 1);
    }

    function write4bitsLCD(valor: number, rs: number): void {
        let backlight = 0x08; let buffer = pins.createBuffer(1);
        buffer.setNumber(NumberFormat.UInt8LE, 0, valor | rs | backlight);
        pins.i2cWriteBuffer(lcdAddr, buffer);

        buffer.setNumber(NumberFormat.UInt8LE, 0, valor | rs | backlight | 0x04);
        pins.i2cWriteBuffer(lcdAddr, buffer); control.waitMicros(1);

        buffer.setNumber(NumberFormat.UInt8LE, 0, (valor | rs | backlight) & ~0x04);
        pins.i2cWriteBuffer(lcdAddr, buffer); control.waitMicros(40);
    }

    /**
     * Inicializa o display gráfico OLED SSD1306 (128x64) via I2C.
     */
    //% blockId=superkit_init_oled block="inicializar Tela OLED I2C endereço %addr"
    //% addr.defl=0x3C weight=90 group="Displays"
    export function inicializarOLED(addr: number): void {
        oledAddr = addr;
        let cmds = [0xAE, 0xD5, 0x80, 0xA8, 0x3F, 0xD3, 0x00, 0x40, 0x8D, 0x14, 0x20, 0x00, 0xA1, 0xC8, 0xDA, 0x12, 0x81, 0xCF, 0xD9, 0xF1, 0xDB, 0x40, 0xA4, 0xA6, 0xAF];
        for (let c of cmds) {
            let buf = pins.createBuffer(2);
            buf.setNumber(NumberFormat.UInt8LE, 0, 0x00);
            buf.setNumber(NumberFormat.UInt8LE, 1, c);
            pins.i2cWriteBuffer(oledAddr, buf);
        }
    }

    /**
     * Inicializa a tela clássica Nokia 5110 via SPI.
     */
    //% blockId=superkit_init_nokia block="inicializar Nokia 5110 | SCK=P13 MOSI=P15 DC=%dc CE=%ce RST=%rst"
    //% weight=85 group="Displays"
    export function inicializarNokia5110(dc: DigitalPin, ce: DigitalPin, rst: DigitalPin): void {
        pins.spiFrequency(4000000); pins.spiFormat(8, 0);
        pins.digitalWritePin(rst, 0); basic.pause(10); pins.digitalWritePin(rst, 1);
        pins.digitalWritePin(ce, 0); pins.digitalWritePin(dc, 0);
        pins.spiWrite(0x21); pins.spiWrite(0xB1); pins.spiWrite(0x13);
        pins.spiWrite(0x20); pins.spiWrite(0x0C); pins.digitalWritePin(ce, 1);
    }

}