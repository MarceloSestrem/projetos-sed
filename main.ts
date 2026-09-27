//% color="#1C2833" weight=120 icon="\uf013" block="Super Kit Automação"
//% groups=['Robótica', 'Displays', 'Keypads & Expansores', 'RFID', 'Sensores', 'LEDs & Atuadores']
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

    export enum AlinhamentoTexto {
        //% block="Esquerda"
        Esquerda = 0,
        //% block="Centro"
        Centro = 1,
        //% block="Direita"
        Direita = 2
    }

    export enum EstadoChave {
        //% block="LIGADO"
        Ligado = 1,
        //% block="DESLIGADO"
        Desligado = 0
    }

    export enum PinoPCF8574 {
        //% block="P0"
        P0 = 0,
        //% block="P1"
        P1 = 1,
        //% block="P2"
        P2 = 2,
        //% block="P3"
        P3 = 3,
        //% block="P4"
        P4 = 4,
        //% block="P5"
        P5 = 5,
        //% block="P6"
        P6 = 6,
        //% block="P7"
        P7 = 7
    }

    // Registradores do PCA9685
    const PCA9685_ADDRESS = 0x40
    const MODE1 = 0x00
    const MODE2 = 0x01
    const PRESCALE = 0xFE
    const LED0_ON_L = 0x06

    let pcaInicializado = false
    let lcdAddr = 0x27
    let oledAddr = 0x3C
    let rfidAddr = 0x24
    let keypadI2cAddr = 0x20
    let pcfState = 0xFF

    const FONTE_OLED = [
        0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x5f, 0x00, 0x00, 0x00, 0x07, 0x00, 0x07, 0x00,
        0x14, 0x7f, 0x14, 0x7f, 0x14, 0x24, 0x2a, 0x7f, 0x2a, 0x12, 0x23, 0x13, 0x08, 0x64, 0x62,
        0x36, 0x49, 0x55, 0x22, 0x50, 0x00, 0x05, 0x03, 0x00, 0x00, 0x00, 0x1c, 0x22, 0x41, 0x00,
        0x00, 0x41, 0x22, 0x1c, 0x00, 0x14, 0x08, 0x3e, 0x08, 0x14, 0x08, 0x08, 0x3e, 0x08, 0x08,
        0x00, 0x50, 0x30, 0x00, 0x00, 0x08, 0x08, 0x08, 0x08, 0x08, 0x00, 0x60, 0x60, 0x00, 0x00,
        0x20, 0x10, 0x08, 0x04, 0x02, 0x3e, 0x51, 0x49, 0x45, 0x3e, 0x00, 0x42, 0x7f, 0x40, 0x00,
        0x42, 0x61, 0x51, 0x49, 0x46, 0x21, 0x41, 0x45, 0x4b, 0x31, 0x18, 0x14, 0x12, 0x7f, 0x10,
        0x27, 0x45, 0x45, 0x45, 0x39, 0x3c, 0x4a, 0x49, 0x49, 0x30, 0x01, 0x71, 0x09, 0x05, 0x03,
        0x36, 0x49, 0x49, 0x49, 0x36, 0x06, 0x49, 0x49, 0x29, 0x1e, 0x00, 0x36, 0x36, 0x00, 0x00,
        0x00, 0x56, 0x36, 0x00, 0x00, 0x08, 0x14, 0x22, 0x41, 0x00, 0x24, 0x24, 0x24, 0x24, 0x24,
        0x00, 0x41, 0x22, 0x14, 0x08, 0x02, 0x01, 0x51, 0x09, 0x06, 0x32, 0x49, 0x79, 0x41, 0x3e,
        0x7e, 0x11, 0x11, 0x11, 0x7e, 0x7f, 0x49, 0x49, 0x49, 0x36, 0x3e, 0x41, 0x41, 0x41, 0x22,
        0x7f, 0x41, 0x41, 0x22, 0x1c, 0x7f, 0x49, 0x49, 0x49, 0x41, 0x7f, 0x09, 0x09, 0x09, 0x01,
        0x3e, 0x41, 0x49, 0x49, 0x7a, 0x7f, 0x08, 0x08, 0x08, 0x7f, 0x00, 0x41, 0x7f, 0x41, 0x00,
        0x20, 0x40, 0x41, 0x3f, 0x01, 0x7f, 0x08, 0x14, 0x22, 0x41, 0x7f, 0x40, 0x40, 0x40, 0x40,
        0x7f, 0x02, 0x0c, 0x02, 0x7f, 0x7f, 0x04, 0x08, 0x10, 0x7f, 0x3e, 0x41, 0x41, 0x41, 0x3e,
        0x7f, 0x09, 0x09, 0x09, 0x06, 0x3e, 0x41, 0x51, 0x21, 0x5e, 0x7f, 0x09, 0x19, 0x29, 0x46,
        0x46, 0x49, 0x49, 0x49, 0x31, 0x01, 0x01, 0x7f, 0x01, 0x01, 0x3f, 0x40, 0x40, 0x40, 0x3f,
        0x1f, 0x20, 0x40, 0x20, 0x1f, 0x3f, 0x40, 0x38, 0x40, 0x3f, 0x63, 0x14, 0x08, 0x14, 0x63,
        0x07, 0x08, 0x70, 0x08, 0x07, 0x61, 0x51, 0x49, 0x45, 0x43
    ]

    // =======================================================
    // 🤖 SUB-CATEGORIA: ROBÓTICA
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

        buf.setNumber(NumberFormat.UInt8LE, 0, MODE2);
        buf.setNumber(NumberFormat.UInt8LE, 1, 0x04);
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
     * Controla um motor DC individual na Robotbit.
     */
    //% blockId=robotbit_controlar_motor block="mover motor %motor | velocidade %velocidade"
    //% velocidade.min=-255 velocidade.max=255
    //% weight=100 group="Robótica"
    export function controlarMotor(motor: MotorSelecao, velocidade: number): void {
        let canalM1 = 0; let canalM2 = 0;
        if (motor == MotorSelecao.M1A) { canalM1 = 2; canalM2 = 3; }
        else if (motor == MotorSelecao.M1B) { canalM1 = 4; canalM2 = 5; }
        else if (motor == MotorSelecao.M2A) { canalM1 = 6; canalM2 = 7; }
        else if (motor == MotorSelecao.M2B) { canalM1 = 8; canalM2 = 9; }

        let pinoDir = (motor == MotorSelecao.M1A) ? DigitalPin.P1 : (motor == MotorSelecao.M1B ? DigitalPin.P11 : (motor == MotorSelecao.M2A ? DigitalPin.P14 : DigitalPin.P15));
        pins.digitalWritePin(pinoDir, velocidade >= 0 ? 0 : 1);

        let velMapeada = Math.map(Math.abs(velocidade), 0, 255, 0, 4095);
        writePWM(canalM1, velMapeada);
        writePWM(canalM2, 0);
    }

    /**
     * Controla dois motores DC simultaneamente.
     */
    //% blockId=robotbit_controlar_dois_motores block="mover motor 1 %motor1 velocidade %vel1 | e motor 2 %motor2 velocidade %vel2"
    //% vel1.min=-255 vel1.max=255 vel2.min=-255 vel2.max=255
    //% weight=98 group="Robótica" inlineInputMode=inline
    export function controlarDoisMotores(motor1: MotorSelecao, vel1: number, motor2: MotorSelecao, vel2: number): void {
        controlarMotor(motor1, vel1);
        controlarMotor(motor2, vel2);
    }

    /**
     * Desliga e freia imediatamente TODOS os motores DC.
     */
    //% blockId=robotbit_parar_todos_motores block="parar todos os motores"
    //% weight=95 group="Robótica"
    export function pararTodosOsMotores(): void {
        controlarMotor(MotorSelecao.M1A, 0); controlarMotor(MotorSelecao.M1B, 0);
        controlarMotor(MotorSelecao.M2A, 0); controlarMotor(MotorSelecao.M2B, 0);
    }

    /**
     * Controla um Servo Motor nas portas S1 a S4.
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
     * Verifica os 3 sensores de linha conectados em P0, P1 e P2.
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
    // 📺 SUB-CATEGORIA: DISPLAYS
    // =======================================================

    /**
     * Inicializa o display LCD I2C (16x2 ou 20x4).
     */
    //% blockId=superkit_init_lcd block="inicializar LCD I2C endereço %addr | modelo %modelo"
    //% addr.defl=0x27 weight=100 group="Displays"
    export function inicializarLCD(addr: number, modelo: ModeloLCD): void {
        lcdAddr = addr;
        basic.pause(50);
        enviarComandoLCD(0x33); enviarComandoLCD(0x32);
        enviarComandoLCD(0x28); enviarComandoLCD(0x0C); enviarComandoLCD(0x06); enviarComandoLCD(0x01);
        basic.pause(2);
    }

    /**
     * Escreve um texto em uma coordenada exata do LCD.
     */
    //% blockId=superkit_print_lcd block="LCD mostrar texto %texto | na Coluna %coluna Linha %linha"
    //% coluna.min=0 coluna.max=19 weight=98 group="Displays"
    export function mostrarTextoLCD(texto: string, coluna: number, linha: LinhasLCD): void {
        let offsets = [0x00, 0x40, 0x14, 0x54];
        enviarComandoLCD(0x80 | (offsets[linha] + coluna));
        for (let i = 0; i < texto.length; i++) {
            enviarDadosLCD(texto.charCodeAt(i));
        }
    }

    /**
     * Escreve texto alinhado (Esquerda, Centro ou Direita) em uma linha do LCD.
     */
    //% blockId=superkit_print_aligned_lcd block="LCD mostrar texto %texto | alinhado à %alinhamento na Linha %linha (modelo %modelo)"
    //% weight=96 group="Displays"
    export function mostrarTextoAlinhadoLCD(texto: string, alinhamento: AlinhamentoTexto, linha: LinhasLCD, modelo: ModeloLCD): void {
        let largura = (modelo == ModeloLCD.LCD20x4) ? 20 : 16;
        let col = 0;
        if (alinhamento == AlinhamentoTexto.Centro) {
            col = Math.max(0, Math.floor((largura - texto.length) / 2));
        } else if (alinhamento == AlinhamentoTexto.Direita) {
            col = Math.max(0, largura - texto.length);
        }
        mostrarTextoLCD(texto, col, linha);
    }

    /**
     * Escreve um valor numérico no LCD I2C.
     */
    //% blockId=superkit_print_num_lcd block="LCD mostrar número %numero | na Coluna %coluna Linha %linha"
    //% coluna.min=0 coluna.max=19 weight=94 group="Displays"
    export function mostrarNumeroLCD(numero: number, coluna: number, linha: LinhasLCD): void {
        mostrarTextoLCD(numero.toString(), coluna, linha);
    }

    /**
     * Cria um caractere customizado para LCD via texto binário de 5 dígitos por linha (ex: 01110).
     */
    //% blockId=superkit_create_char_string block="LCD criar caractere ID %id (0-7) | L1 %l1 L2 %l2 L3 %l3 L4 %l4 L5 %l5 L6 %l6 L7 %l7 L8 %l8"
    //% id.min=0 id.max=7
    //% l1.defl="00000" l2.defl="01010" l3.defl="11111" l4.defl="11111"
    //% l5.defl="01110" l6.defl="00100" l7.defl="00000" l8.defl="00000"
    //% weight=92 group="Displays" inlineInputMode=inline
    export function criarCaractereLCDString(
        id: number,
        l1: string, l2: string, l3: string, l4: string,
        l5: string, l6: string, l7: string, l8: string
    ): void {
        let charId = id & 0x07;
        enviarComandoLCD(0x40 | (charId << 3));
        let linhas = [l1, l2, l3, l4, l5, l6, l7, l8];
        for (let i = 0; i < 8; i++) {
            let str = linhas[i];
            let val = 0;
            for (let j = 0; j < 5; j++) {
                if (j < str.length && (str.charAt(j) == "1" || str.charAt(j) == "#")) {
                    val |= (1 << (4 - j));
                }
            }
            enviarDadosLCD(val);
        }
    }

    /**
     * Desenha um caractere customizado no LCD na posição informada.
     */
    //% blockId=superkit_print_char_lcd block="LCD mostrar caractere customizado ID %id | na Coluna %coluna Linha %linha"
    //% id.min=0 id.max=7 coluna.min=0 coluna.max=19 weight=90 group="Displays"
    export function mostrarCaractereCustomizadoLCD(id: number, coluna: number, linha: LinhasLCD): void {
        let offsets = [0x00, 0x40, 0x14, 0x54];
        enviarComandoLCD(0x80 | (offsets[linha] + coluna));
        enviarDadosLCD(id & 0x07);
    }

    function enviarComandoLCD(cmd: number): void {
        write4bitsLCD(cmd & 0xF0, 0); write4bitsLCD((cmd << 4) & 0xF0, 0);
    }

    function enviarDadosLCD(dado: number): void {
        write4bitsLCD(dado & 0xF0, 1); write4bitsLCD((dado << 4) & 0xF0, 1);
    }

    function write4bitsLCD(valor: number, rs: number): void {
        let backlight = 0x08;
        let buffer = pins.createBuffer(1);
        buffer.setNumber(NumberFormat.UInt8LE, 0, valor | rs | backlight);
        pins.i2cWriteBuffer(lcdAddr, buffer);
        buffer.setNumber(NumberFormat.UInt8LE, 0, valor | rs | backlight | 0x04);
        pins.i2cWriteBuffer(lcdAddr, buffer);
        control.waitMicros(1);
        buffer.setNumber(NumberFormat.UInt8LE, 0, (valor | rs | backlight) & ~0x04);
        pins.i2cWriteBuffer(lcdAddr, buffer);
        control.waitMicros(40);
    }

    /**
     * Inicializa a tela OLED SSD1306 (128x64).
     */
    //% blockId=superkit_init_oled block="inicializar Tela OLED I2C endereço %addr"
    //% addr.defl=0x3C weight=88 group="Displays"
    export function inicializarOLED(addr: number): void {
        oledAddr = addr;
        let cmds = [0xAE, 0xD5, 0x80, 0xA8, 0x3F, 0xD3, 0x00, 0x40, 0x8D, 0x14, 0x20, 0x00, 0xA1, 0xC8, 0xDA, 0x12, 0x81, 0xCF, 0xD9, 0xF1, 0xDB, 0x40, 0xA4, 0xA6, 0xAF];
        for (let c of cmds) {
            let buf = pins.createBuffer(2);
            buf.setNumber(NumberFormat.UInt8LE, 0, 0x00);
            buf.setNumber(NumberFormat.UInt8LE, 1, c);
            pins.i2cWriteBuffer(oledAddr, buf);
        }
        limparOLED();
    }

    /**
     * Limpa a tela OLED.
     */
    //% blockId=superkit_clear_oled block="limpar Tela OLED"
    //% weight=86 group="Displays"
    export function limparOLED(): void {
        for (let pagina = 0; pagina < 8; pagina++) {
            setPosicaoOLED(0, pagina);
            let buf = pins.createBuffer(17);
            buf.setNumber(NumberFormat.UInt8LE, 0, 0x40);
            for (let i = 1; i < 17; i++) buf.setNumber(NumberFormat.UInt8LE, i, 0x00);
            for (let x = 0; x < 8; x++) pins.i2cWriteBuffer(oledAddr, buf);
        }
    }

    function setPosicaoOLED(coluna: number, pagina: number): void {
        let buf = pins.createBuffer(2);
        buf.setNumber(NumberFormat.UInt8LE, 0, 0x00);
        buf.setNumber(NumberFormat.UInt8LE, 1, 0xB0 | pagina);
        pins.i2cWriteBuffer(oledAddr, buf);
        buf.setNumber(NumberFormat.UInt8LE, 1, 0x00 | (coluna & 0x0F));
        pins.i2cWriteBuffer(oledAddr, buf);
        buf.setNumber(NumberFormat.UInt8LE, 1, 0x10 | ((coluna >> 4) & 0x0F));
        pins.i2cWriteBuffer(oledAddr, buf);
    }

    /**
     * Mostra um texto na OLED.
     */
    //% blockId=superkit_print_oled block="OLED mostrar texto %texto | na Coluna %x Linha %y"
    //% x.min=0 x.max=120 y.min=0 y.max=7 weight=84 group="Displays"
    export function mostrarTextoOLED(texto: string, x: number, y: number): void {
        setPosicaoOLED(x, y);
        for (let k = 0; k < texto.length; k++) {
            let charCode = texto.charCodeAt(k);
            let indiceFonte = (charCode - 32) * 5;
            if (indiceFonte < 0 || indiceFonte >= FONTE_OLED.length) indiceFonte = 0;
            let buf = pins.createBuffer(6);
            buf.setNumber(NumberFormat.UInt8LE, 0, 0x40);
            for (let i = 0; i < 5; i++) {
                buf.setNumber(NumberFormat.UInt8LE, i + 1, FONTE_OLED[indiceFonte + i]);
            }
            pins.i2cWriteBuffer(oledAddr, buf);
        }
    }

    /**
     * Inicializa o Nokia 5110 via SPI.
     */
    //% blockId=superkit_init_nokia block="inicializar Nokia 5110 | SCK=P13 MOSI=P15 DC=%dc CE=%ce RST=%rst"
    //% weight=82 group="Displays"
    export function inicializarNokia5110(dc: DigitalPin, ce: DigitalPin, rst: DigitalPin): void {
        pins.spiFrequency(4000000);
        pins.spiFormat(8, 0);
        pins.digitalWritePin(rst, 0); basic.pause(10); pins.digitalWritePin(rst, 1);
        pins.digitalWritePin(ce, 0); pins.digitalWritePin(dc, 0);
        pins.spiWrite(0x21); pins.spiWrite(0xB1); pins.spiWrite(0x13);
        pins.spiWrite(0x20); pins.spiWrite(0x0C); pins.digitalWritePin(ce, 1);
    }

    // =======================================================
    // 🎛️ SUB-CATEGORIA: KEYPADS & EXPANSORES
    // =======================================================

    /**
     * Varre o Keypad 4x4 ligado na Robotbit (P0-P15).
     */
    //% blockId=superkit_read_keypad block="varrer Keypad Robotbit (P0-P15)"
    //% weight=100 group="Keypads & Expansores"
    export function lerKeypad4x4(): string {
        let teclas = ["1", "2", "3", "A", "4", "5", "6", "B", "7", "8", "9", "C", "*", "0", "#", "D"];
        let linhas = [DigitalPin.P0, DigitalPin.P1, DigitalPin.P2, DigitalPin.P8];
        let colunas = [DigitalPin.P12, DigitalPin.P13, DigitalPin.P14, DigitalPin.P15];
        for (let c = 0; c < 4; c++) pins.setPull(colunas[c], PinPullMode.PullUp);
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
     * Configura o endereço I2C do Keypad (PCF8574).
     */
    //% blockId=superkit_init_i2c_keypad block="configurar Keypad I2C endereço %addr"
    //% addr.defl=0x20 weight=95 group="Keypads & Expansores"
    export function configurarKeypadI2C(addr: number): void {
        keypadI2cAddr = addr;
        let buf = pins.createBuffer(1);
        buf.setNumber(NumberFormat.UInt8LE, 0, 0xFF);
        pins.i2cWriteBuffer(keypadI2cAddr, buf);
    }

    /**
     * Varre o Keypad 4x4 via I2C.
     */
    //% blockId=superkit_read_i2c_keypad block="varrer Keypad 4x4 via I2C"
    //% weight=90 group="Keypads & Expansores"
    export function lerKeypadI2C(): string {
        let teclas = ["1", "2", "3", "A", "4", "5", "6", "B", "7", "8", "9", "C", "*", "0", "#", "D"];
        for (let r = 0; r < 4; r++) {
            let wBuf = pins.createBuffer(1);
            wBuf.setNumber(NumberFormat.UInt8LE, 0, 0xFF & ~(1 << r));
            pins.i2cWriteBuffer(keypadI2cAddr, wBuf);
            let rBuf = pins.i2cReadBuffer(keypadI2cAddr, 1);
            let leitura = rBuf.getNumber(NumberFormat.UInt8LE, 0);
            for (let c = 0; c < 4; c++) {
                if (((leitura >> (4 + c)) & 0x01) == 0) {
                    let rstBuf = pins.createBuffer(1);
                    rstBuf.setNumber(NumberFormat.UInt8LE, 0, 0xFF);
                    pins.i2cWriteBuffer(keypadI2cAddr, rstBuf);
                    return teclas[r * 4 + c];
                }
            }
        }
        return "";
    }

    /**
     * Escreve um byte completo na placa PCF8574.
     */
    //% blockId=superkit_write_pcf8574 block="expansor PCF8574 endereço %addr | enviar byte %byteData"
    //% addr.defl=0x20 weight=85 group="Keypads & Expansores"
    export function writePCF8574(addr: number, byteData: number): void {
        let buf = pins.createBuffer(1);
        buf.setNumber(NumberFormat.UInt8LE, 0, byteData);
        pins.i2cWriteBuffer(addr, buf);
    }

    /**
     * Controla um pino individual (P0 a P7) da placa expansora PCF8574.
     */
    //% blockId=superkit_write_pcf8574_pin block="expansor PCF8574 endereço %addr | pino %pino como %estado"
    //% addr.defl=0x20 weight=84 group="Keypads & Expansores"
    export function controlarPinoPCF8574(addr: number, pino: PinoPCF8574, estado: EstadoChave): void {
        if (estado == EstadoChave.Ligado) {
            pcfState |= (1 << pino);
        } else {
            pcfState &= ~(1 << pino);
        }
        writePCF8574(addr, pcfState);
    }

    /**
     * Lê o estado de um pino individual (P0 a P7) do expansor PCF8574.
     */
    //% blockId=superkit_read_pcf8574_pin block="expansor PCF8574 endereço %addr | ler pino %pino"
    //% addr.defl=0x20 weight=83 group="Keypads & Expansores"
    export function lerPinoPCF8574(addr: number, pino: PinoPCF8574): number {
        let rBuf = pins.i2cReadBuffer(addr, 1);
        let val = rBuf.getNumber(NumberFormat.UInt8LE, 0);
        return ((val & (1 << pino)) != 0) ? 1 : 0;
    }

    // =======================================================
    // 🔑 SUB-CATEGORIA: RFID
    // =======================================================

    /**
     * Inicializa o RFID PN532 via I2C.
     */
    //% blockId=superkit_init_rfid block="inicializar Leitor RFID PN532 via I2C"
    //% weight=100 group="RFID"
    export function inicializarPN532(): boolean {
        let buf = pins.createBuffer(7);
        buf.setNumber(NumberFormat.UInt8LE, 0, 0x00);
        buf.setNumber(NumberFormat.UInt8LE, 1, 0x00);
        buf.setNumber(NumberFormat.UInt8LE, 2, 0xFF);
        buf.setNumber(NumberFormat.UInt8LE, 3, 0x03);
        buf.setNumber(NumberFormat.UInt8LE, 4, 0xFC);
        buf.setNumber(NumberFormat.UInt8LE, 5, 0xD4);
        buf.setNumber(NumberFormat.UInt8LE, 6, 0x14);
        pins.i2cWriteBuffer(rfidAddr, buf);
        return true;
    }

    /**
     * Retorna o código UID da tag RFID aproximada.
     */
    //% blockId=superkit_read_rfid_uid block="ler UID da tag RFID presente"
    //% weight=95 group="RFID"
    export function lerTagUID(): string {
        let cmd = pins.createBuffer(9);
        cmd.setNumber(NumberFormat.UInt8LE, 0, 0x00);
        cmd.setNumber(NumberFormat.UInt8LE, 1, 0x00);
        cmd.setNumber(NumberFormat.UInt8LE, 2, 0xFF);
        cmd.setNumber(NumberFormat.UInt8LE, 3, 0x04);
        cmd.setNumber(NumberFormat.UInt8LE, 4, 0xFC);
        cmd.setNumber(NumberFormat.UInt8LE, 5, 0xD4);
        cmd.setNumber(NumberFormat.UInt8LE, 6, 0x4A);
        cmd.setNumber(NumberFormat.UInt8LE, 7, 0x01);
        cmd.setNumber(NumberFormat.UInt8LE, 8, 0x00);
        pins.i2cWriteBuffer(rfidAddr, cmd);
        basic.pause(30);
        let response = pins.i2cReadBuffer(rfidAddr, 20);
        if (response.getNumber(NumberFormat.UInt8LE, 6) == 0x4B) {
            let uid = "";
            let numBytes = response.getNumber(NumberFormat.UInt8LE, 12);
            let hexChars = "0123456789ABCDEF";
            for (let i = 0; i < numBytes; i++) {
                let byteValor = response.getNumber(NumberFormat.UInt8LE, 13 + i);
                uid += hexChars.charAt((byteValor >> 4) & 0x0F) + hexChars.charAt(byteValor & 0x0F);
            }
            return uid;
        }
        return "";
    }

    // =======================================================
    // 🌡️ SUB-CATEGORIA: SENSORES (ÁGUA, GÁS, SOLO, LDR E PORTAS)
    // =======================================================

    /**
     * Lê o nível de chuva ou presença de água no pino analógico (0 a 1023).
     */
    //% blockId=superkit_sensor_agua block="sensor de água/chuva no pino analógico %pino"
    //% weight=100 group="Sensores"
    export function lerSensorAgua(pino: AnalogPin): number {
        return pins.analogReadPin(pino);
    }

    /**
     * Lê o nível de gás (MQ-2 / MQ-135) no pino analógico (0 a 1023).
     */
    //% blockId=superkit_sensor_gas block="sensor de gás no pino analógico %pino"
    //% weight=95 group="Sensores"
    export function lerSensorGas(pino: AnalogPin): number {
        return pins.analogReadPin(pino);
    }

    /**
     * Lê a umidade do solo para hortas e converte em Porcentagem (0% a 100%).
     */
    //% blockId=superkit_sensor_umidade_solo block="umidade do solo (0-100%%) no pino analógico %pino"
    //% weight=90 group="Sensores"
    export function lerUmidadeSolo(pino: AnalogPin): number {
        let leitura = pins.analogReadPin(pino);
        let porcentagem = Math.map(leitura, 0, 1023, 0, 100);
        return Math.clamp(0, 100, Math.round(porcentagem));
    }

    /**
     * Lê a luminosidade do ambiente através de um sensor LDR (0 a 1023).
     */
    //% blockId=superkit_sensor_ldr block="luminosidade LDR no pino analógico %pino"
    //% weight=85 group="Sensores"
    export function lerLuminosidadeLDR(pino: AnalogPin): number {
        return pins.analogReadPin(pino);
    }

    /**
     * Leitura de qualquer entrada Digital (0 ou 1).
     */
    //% blockId=superkit_ler_porta_digital block="ler porta digital %pino"
    //% weight=80 group="Sensores"
    export function lerPortaDigital(pino: DigitalPin): number {
        return pins.digitalReadPin(pino);
    }

    /**
     * Leitura direta de qualquer porta Analógica (0 a 1023).
     */
    //% blockId=superkit_ler_porta_analogica block="ler porta analógica %pino"
    //% weight=75 group="Sensores"
    export function lerPortaAnalogica(pino: AnalogPin): number {
        return pins.analogReadPin(pino);
    }

    // =======================================================
    // 💡 SUB-CATEGORIA: LEDS & ATUADORES (AUTOMAÇÃO, CASAS E HORTAS)
    // =======================================================

    /**
     * Aciona ou desliga um módulo Relé ou Bomba D'água para irrigação.
     */
    //% blockId=superkit_rele_bomba block="definir Relé / Bomba D'água no pino %pino como %estado"
    //% weight=100 group="LEDs & Atuadores"
    export function controlarReleBomba(pino: DigitalPin, estado: EstadoChave): void {
        pins.digitalWritePin(pino, estado);
    }

    /**
     * Aciona ou desliga um LED simples ligado a uma porta digital.
     */
    //% blockId=superkit_led_digital block="definir LED no pino digital %pino como %estado"
    //% weight=95 group="LEDs & Atuadores"
    export function controlarLEDDigital(pino: DigitalPin, estado: EstadoChave): void {
        pins.digitalWritePin(pino, estado);
    }

    /**
     * Regula o brilho de lâmpadas/LEDs (Dimerização PWM de 0 a 100%).
     */
    //% blockId=superkit_led_dimerizado block="ajustar brilho do LED no pino analógico %pino em %porcentagem %%"
    //% porcentagem.min=0 porcentagem.max=100 weight=90 group="LEDs & Atuadores"
    export function controlarBrilhoLED(pino: AnalogPin, porcentagem: number): void {
        let pwmValor = Math.map(Math.clamp(0, 100, porcentagem), 0, 100, 0, 1023);
        pins.analogWritePin(pino, Math.round(pwmValor));
    }

    /**
     * Controla as cores de um LED RGB comum conectado em portas analógicas.
     */
    //% blockId=superkit_led_rgb block="definir LED RGB | Pino R %pinoR Pino G %pinoG Pino B %pinoB | Red %r Green %g Blue %b"
    //% r.min=0 r.max=255 g.min=0 g.max=255 b.min=0 b.max=255
    //% weight=85 group="LEDs & Atuadores" inlineInputMode=inline
    export function controlarLEDRGB(pinoR: AnalogPin, pinoG: AnalogPin, pinoB: AnalogPin, r: number, g: number, b: number): void {
        pins.analogWritePin(pinoR, Math.map(Math.clamp(0, 255, r), 0, 255, 0, 1023));
        pins.analogWritePin(pinoG, Math.map(Math.clamp(0, 255, g), 0, 255, 0, 1023));
        pins.analogWritePin(pinoB, Math.map(Math.clamp(0, 255, b), 0, 255, 0, 1023));
    }

    /**
     * Controla um semáforo de veículos (Verde, Amarelo e Vermelho) para maquetes.
     */
    //% blockId=superkit_controlar_semaforo block="semáforo de veículos | Verde %pinoV Amarelo %pinoA Vermelho %pinoVm | Verde %estV Amarelo %estA Vermelho %estVm"
    //% weight=80 group="LEDs & Atuadores" inlineInputMode=inline
    export function controlarSemaforo(
        pinoV: DigitalPin, pinoA: DigitalPin, pinoVm: DigitalPin,
        estV: EstadoChave, estA: EstadoChave, estVm: EstadoChave
    ): void {
        pins.digitalWritePin(pinoV, estV);
        pins.digitalWritePin(pinoA, estA);
        pins.digitalWritePin(pinoVm, estVm);
    }

    /**
     * Controla um semáforo de pedestres (Verde e Vermelho) para maquetes.
     */
    //% blockId=superkit_controlar_semaforo_pedestre block="semáforo de pedestre | Verde %pinoV Vermelho %pinoVm | Verde %estV Vermelho %estVm"
    //% weight=78 group="LEDs & Atuadores" inlineInputMode=inline
    export function controlarSemaforoPedestre(
        pinoV: DigitalPin, pinoVm: DigitalPin,
        estV: EstadoChave, estVm: EstadoChave
    ): void {
        pins.digitalWritePin(pinoV, estV);
        pins.digitalWritePin(pinoVm, estVm);
    }
}