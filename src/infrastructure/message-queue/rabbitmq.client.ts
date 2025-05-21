import * as amqp from 'amqplib/callback_api';

export class RabbitMQClient {
  private connection: amqp.Connection | null = null;
  private channel: amqp.Channel | null = null;

  constructor(private readonly url: string) { }

  public connect(): Promise<void> {
    return new Promise((resolve, reject) => {
      amqp.connect(this.url, (err, conn) => {
        if (err) {
          console.error('RabbitMQ: Falha ao conectar:', err);
          return reject(err);
        }

        this.connection = conn;

        conn.createChannel((err, ch) => {
          if (err) {
            console.error('RabbitMQ: Falha ao criar canal:', err);
            return reject(err);
          }

          this.channel = ch;
          console.log('RabbitMQ: Conexão e canal estabelecidos.');

          conn.on('close', () => {
            console.error('RabbitMQ: Conexão perdida. Tentando reconectar...');
            setTimeout(() => this.connect(), 5000);
          });

          conn.on('error', (err) => {
            console.error('RabbitMQ: Erro de conexão:', err);
          });

          resolve();
        });
      });
    });
  }

  public publish(queue: string, message: string): Promise<boolean> {
    return new Promise((resolve, reject) => {
      if (!this.channel) {
        return reject(new Error('RabbitMQ channel not available. Call connect() first.'));
      }

      this.channel.assertQueue(queue, { durable: true }, (err) => {
        if (err) {
          return reject(err);
        }

        const sent = this.channel!.sendToQueue(
          queue,
          Buffer.from(message),
          { persistent: true }
        );
        resolve(sent);
      });
    });
  }

  public consume(queue: string, callback: (msg: string) => Promise<void>): Promise<void> {
    return new Promise((resolve, reject) => {
      if (!this.channel) {
        return reject(new Error('RabbitMQ channel not available. Call connect() first.'));
      }

      this.channel.assertQueue(queue, { durable: true }, (err) => {
        if (err) {
          return reject(err);
        }

        this.channel!.consume(queue, async (msg) => {
          if (msg) {
            try {
              await callback(msg.content.toString());
              this.channel?.ack(msg);
            } catch (error) {
              console.error(`Erro ao processar mensagem da fila ${queue}:`, error);
              this.channel?.nack(msg, false, true);
            }
          }
        }, { noAck: false });

        console.log(`RabbitMQ: Consumindo mensagens da fila: ${queue}`);
        resolve();
      });
    });
  }

  public close(): Promise<void> {
    return new Promise((resolve, reject) => {
      const closeChannel = (cb: (err?: Error) => void) => {
        if (!this.channel) return cb();
        this.channel.close((err) => cb(err));
      };

      const closeConnection = (cb: (err?: Error) => void) => {
        if (!this.connection) return cb();
        this.connection.close((err) => cb(err));
      };

      closeChannel((err) => {
        if (err) {
          console.error('Erro ao fechar canal:', err);
          return reject(err);
        }

        closeConnection((err) => {
          if (err) {
            console.error('Erro ao fechar conexão:', err);
            return reject(err);
          }

          console.log('RabbitMQ: Conexão fechada.');
          resolve();
        });
      });
    });
  }
}