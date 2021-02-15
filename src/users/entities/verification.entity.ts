import { v4 as uuidv4 } from 'uuid';
import { Field, InputType, ObjectType } from '@nestjs/graphql';
import { CoreEntity } from 'src/common/entities/core.entity';
import { BeforeInsert, Column, Entity, JoinColumn, OneToOne } from 'typeorm';
import { User } from './user.entity';

@InputType({ isAbstract: true })
@ObjectType()
@Entity()
export class Verification extends CoreEntity {
  @Column()
  @Field(() => String)
  code: string;

  @OneToOne(() => User, { onDelete: 'CASCADE' }) // user가 삭제되면, user와 붙어있는 verification도 삭제
  @JoinColumn() // 외래키 : Verification으로부터 User에 접근하고 싶다면, Verification에 @JoinColumn어노테이션을 작성해줌
  user: User;

  @BeforeInsert()
  createCode(): void {
    this.code = uuidv4();
  }
}
