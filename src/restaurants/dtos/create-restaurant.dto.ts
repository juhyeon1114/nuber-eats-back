import { ArgsType, Field, InputType } from '@nestjs/graphql';
import { IsBoolean, IsString, Length } from 'class-validator';

// @InputType()
@ArgsType()
export class CreateRestaurantDto {
  @Field(() => String)
  @IsString()
  @Length(5, 10)
  name: string;

  @Field(() => Boolean)
  @IsBoolean()
  isVegan: boolean;

  @Field(() => String)
  @IsString()
  address: string;

  @Field(() => String)
  @IsString()
  ownerName: string;
}

/**
 * InputType vs ArgsType
 * InputType은 선언한 객체를 input으로 받기 위해서 사용함. 객체의 형을 꼭 유지한 값을 입력받을 수 있다.
 * ArgsTypedms 선언한 객체의 field들을 입력받기 위해서 사용함. 객체의 형을 유지할 필요 없이 field들을 입력받을 수 있다.
 */
