import { ReactNode } from 'react';

export interface BaseCardProps {
  className?: string;
  children: ReactNode;
}

export interface CardProps extends BaseCardProps {}
export interface CardHeaderProps extends BaseCardProps {}
export interface CardTitleProps extends BaseCardProps {}
export interface CardDescriptionProps extends BaseCardProps {}
export interface CardContentProps extends BaseCardProps {}
export interface CardFooterProps extends BaseCardProps {} 