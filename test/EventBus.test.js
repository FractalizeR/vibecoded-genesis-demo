import { describe, it, expect, vi } from 'vitest';
import { EventBus } from '../js/core/EventBus.js';

describe('EventBus', () => {
  it('вызывает callback при emit', () => {
    const bus = new EventBus();
    const callback = vi.fn();

    bus.on('test', callback);
    bus.emit('test');

    expect(callback).toHaveBeenCalled();
  });

  it('передаёт данные в callback', () => {
    const bus = new EventBus();
    const callback = vi.fn();
    const data = { foo: 'bar' };

    bus.on('test', callback);
    bus.emit('test', data);

    expect(callback).toHaveBeenCalledWith(data);
  });

  it('поддерживает множественных слушателей', () => {
    const bus = new EventBus();
    const callback1 = vi.fn();
    const callback2 = vi.fn();

    bus.on('test', callback1);
    bus.on('test', callback2);
    bus.emit('test');

    expect(callback1).toHaveBeenCalled();
    expect(callback2).toHaveBeenCalled();
  });

  it('off() отписывает конкретный callback', () => {
    const bus = new EventBus();
    const callback = vi.fn();

    bus.on('test', callback);
    bus.off('test', callback);
    bus.emit('test');

    expect(callback).not.toHaveBeenCalled();
  });

  it('не вызывает отписанный callback, но вызывает другие', () => {
    const bus = new EventBus();
    const callback1 = vi.fn();
    const callback2 = vi.fn();

    bus.on('test', callback1);
    bus.on('test', callback2);
    bus.off('test', callback1);
    bus.emit('test');

    expect(callback1).not.toHaveBeenCalled();
    expect(callback2).toHaveBeenCalled();
  });

  it('вызывает callbacks в порядке подписки (FIFO)', () => {
    const bus = new EventBus();
    const order = [];

    bus.on('test', () => order.push(1));
    bus.on('test', () => order.push(2));
    bus.on('test', () => order.push(3));
    bus.emit('test');

    expect(order).toEqual([1, 2, 3]);
  });

  it('продолжает вызывать callbacks даже если один бросает ошибку', () => {
    const bus = new EventBus();
    const callback1 = vi.fn(() => { throw new Error('test'); });
    const callback2 = vi.fn();

    bus.on('test', callback1);
    bus.on('test', callback2);

    // Не должно бросить ошибку наружу
    expect(() => bus.emit('test')).not.toThrow();
    expect(callback2).toHaveBeenCalled();
  });

  it('emit на несуществующее событие не бросает ошибку', () => {
    const bus = new EventBus();
    expect(() => bus.emit('nonexistent')).not.toThrow();
  });

  it('off на несуществующий callback не бросает ошибку', () => {
    const bus = new EventBus();
    const callback = vi.fn();
    expect(() => bus.off('test', callback)).not.toThrow();
  });
});
